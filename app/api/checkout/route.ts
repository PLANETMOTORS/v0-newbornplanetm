import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/redis"
import { getClientIp } from "@/lib/security/client-ip"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`checkout:${ip}`, 20, 3600)
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    // Record checkout step selection (used by double-click prevention tests)
    return NextResponse.json({ success: true, step: body.step })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
