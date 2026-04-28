import { NextRequest } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { AUTH_RATE_LIMITS, checkAuthRateLimit } from "@/lib/security/auth-rate-limit"

// POST /api/v1/auth/refresh - Refresh JWT token
//
// SECURITY: rate-limited by (client IP + sha256(refresh-token)) at
// 60 attempts / hour. This kills credential-stuffing variants that
// pelt /refresh with stolen tokens to validate which ones are still
// alive without ever logging in.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Refresh token is required", 400)
    }

    const rate = await checkAuthRateLimit(request, String(refreshToken), AUTH_RATE_LIMITS.REFRESH)
    if (!rate.allowed) {
      return apiError(
        ErrorCode.RATE_LIMITED,
        "Too many refresh attempts. Please try again later.",
        429,
        { retryAfterSeconds: rate.retryAfterSeconds }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return apiError(ErrorCode.CONFIG_ERROR, "Server configuration error")
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) {
      return apiError(ErrorCode.UNAUTHORIZED, "Invalid or expired refresh token", 401)
    }

    return apiSuccess({
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    })
  } catch (error) {
    console.error("[auth/refresh] failed:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Token refresh failed")
  }
}
