import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Record checkout step selection (used by double-click prevention tests)
    return NextResponse.json({ success: true, step: body.step })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
