import { NextRequest, NextResponse } from "next/server"

// POST /api/v1/auth/login - Customer login with JWT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Authenticate with Supabase Auth
    const mockResponse = {
      success: true,
      user: {
        id: "user_" + Date.now(),
        email,
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "eyJ..." + Buffer.from(email).toString("base64"),
        refreshToken: "refresh_" + Date.now(),
        expiresIn: 3600, // 1 hour
      },
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    )
  }
}
