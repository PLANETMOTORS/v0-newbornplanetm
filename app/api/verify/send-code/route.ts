import { NextRequest, NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit, storeVerificationCode } from "@/lib/redis"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  // CSRF origin validation
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 })
  }

  // Rate limiting: 5 verification codes per hour per IP
  const forwarded = req.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`verify:${ip}`, 5, 3600)
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const { method, destination, purpose, vehicleName, vehicleInfo } = await req.json()

    if (!destination || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate verification code SERVER-SIDE using cryptographic randomness
    const code = crypto.randomInt(100000, 999999).toString()

    // Store the code in Redis with 10-minute TTL
    const stored = await storeVerificationCode(destination, code, 600)
    if (!stored) {
      // If Redis is unavailable, still allow the flow but log a warning
      console.warn("[Verify] Redis unavailable — verification code not persisted")
    }

    if (method === "email") {
      const purposeText = purpose === "price_negotiation"
        ? `negotiate on ${vehicleName}`
        : `get your instant cash offer for ${vehicleInfo || "your vehicle"}`

      await sendNotificationEmail({
        type: "verification_code",
        customerEmail: destination,
        customerName: "Customer",
        additionalData: {
          code,
          purpose: purposeText,
          expiresIn: "10 minutes",
        },
      })

      return NextResponse.json({ success: true, method: "email" })
    } else if (method === "phone") {
      // For SMS, you would integrate with Twilio here
      console.log(`[SMS] Verification code would be sent to ${destination}`)

      return NextResponse.json({ success: true, method: "sms", demo: true })
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
