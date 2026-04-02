import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ldervbcvkoawwknsemuz.supabase.co"

// POST /api/v1/auth/refresh - Refresh JWT token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      )
    }

    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createSupabaseClient(SUPABASE_URL, supabaseAnonKey)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    )
  }
}
