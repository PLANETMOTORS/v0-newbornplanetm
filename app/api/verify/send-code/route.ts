import { NextRequest, NextResponse } from "next/server"
import { randomInt } from "crypto"
import { sendNotificationEmail } from "@/lib/email"
import { rateLimit, storeVerificationCode } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  try {
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit: 5 verification code requests per hour per IP
    const forwarded = req.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`verify:${ip}`, 5, 3600)
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { method, destination, purpose, vehicleName, vehicleInfo } = await req.json()

    if (!destination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Server generates the verification code — never trust client-supplied codes
    const code = String(randomInt(100000, 999999))

    // Store code server-side with 10-minute TTL
    await storeVerificationCode(destination, code, 600)

    if (method === "email") {
      // Send verification code via email
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
      // For demo purposes, we'll just log it
      console.log(`[SMS] Verification code would be sent to ${destination}`)
      
      return NextResponse.json({ success: true, method: "sms", demo: true })
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
