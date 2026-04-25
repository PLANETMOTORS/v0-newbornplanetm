import { NextRequest, NextResponse } from "next/server"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit, getVerificationCode, deleteVerificationCode } from "@/lib/redis"

export async function POST(req: NextRequest) {
  // CSRF origin validation
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 })
  }

  // Rate limiting: 10 verification attempts per hour per IP
  const forwarded = req.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`verify-check:${ip}`, 10, 3600)
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  try {
    const { destination, code } = await req.json()

    if (!destination || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Look up the server-generated code from Redis
    const storedCode = await getVerificationCode(destination)

    if (!storedCode) {
      return NextResponse.json({ error: "Code expired or not found. Please request a new code." }, { status: 410 })
    }

    // Constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(code)
    const storedBuffer = Buffer.from(storedCode)

    if (codeBuffer.length !== storedBuffer.length) {
      return NextResponse.json({ verified: false, error: "Invalid code" }, { status: 401 })
    }

    const { timingSafeEqual } = await import("crypto")
    const isValid = timingSafeEqual(codeBuffer, storedBuffer)

    if (isValid) {
      // Delete the code after successful verification (one-time use)
      await deleteVerificationCode(destination)
      return NextResponse.json({ verified: true })
    }

    return NextResponse.json({ verified: false, error: "Invalid code" }, { status: 401 })
  } catch (error) {
    console.error("Verification check error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
