import { NextRequest } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

const SUPABASE_URL = "https://ldervbcvkoawwknsemuz.supabase.co"

// POST /api/v1/auth/refresh - Refresh JWT token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Refresh token is required", 400)
    }

    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseAnonKey) {
      return apiError(ErrorCode.CONFIG_ERROR, "Server configuration error")
    }

    const supabase = createSupabaseClient(SUPABASE_URL, supabaseAnonKey)
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
  } catch (_error) {
    return apiError(ErrorCode.INTERNAL_ERROR, "Token refresh failed")
  }
}
