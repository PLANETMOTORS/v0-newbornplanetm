import { NextRequest } from "next/server"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { createAnonClientOrError } from "@/lib/supabase/anon-client"
import { AUTH_RATE_LIMITS, checkAuthRateLimit } from "@/lib/security/auth-rate-limit"

// POST /api/v1/auth/login - Customer login
//
// SECURITY: rate-limited by (client IP + email hash) at 5 attempts / 15 min
// to neutralise credential brute-force and credential-stuffing. Email is
// only used through a one-way sha256 fingerprint so a Redis-cache snapshot
// never leaks the email list. Same defence covers /api/v1/auth/refresh.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Email and password are required", 400)
    }

    // Rate-limit BEFORE we touch Supabase so a brute-force burst can't
    // saturate auth.signInWithPassword either.
    const rate = await checkAuthRateLimit(request, String(email), AUTH_RATE_LIMITS.LOGIN)
    if (!rate.allowed) {
      return apiError(
        ErrorCode.RATE_LIMITED,
        "Too many login attempts. Please try again later.",
        429,
        { retryAfterSeconds: rate.retryAfterSeconds }
      )
    }

    const result = createAnonClientOrError()
    if ('error' in result) return result.error
    const supabase = result.client
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return apiError(ErrorCode.UNAUTHORIZED, "Invalid email or password", 401)
    }

    return apiSuccess({
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      },
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    })
  } catch (error) {
    console.error("[auth/login] failed:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Authentication failed")
  }
}
