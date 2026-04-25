import { NextRequest } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

// POST /api/v1/auth/login - Customer login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Email and password are required", 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return apiError(ErrorCode.CONFIG_ERROR, "Server configuration error")
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
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
    console.error("[v1/auth/login]", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Authentication failed")
  }
}
