import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getVerificationCode, deleteVerificationCode } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  try {
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit: 10 verification attempts per hour per IP
    const forwarded = req.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`verify-check:${ip}`, 10, 3600)
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const { destination, code } = await req.json()

    if (!destination || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const storedCode = await getVerificationCode(destination)

    if (!storedCode) {
      return NextResponse.json({ success: false, error: "Code expired or not found. Please request a new code." }, { status: 400 })
    }

    if (storedCode !== code) {
      return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 })
    }

    // Code is valid — delete it so it can't be reused
    await deleteVerificationCode(destination)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verification check error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
