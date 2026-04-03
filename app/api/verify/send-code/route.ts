import { NextRequest, NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { method, destination, code, purpose, vehicleName, vehicleInfo } = await req.json()

    if (!destination || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

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
      console.log(`[SMS] Verification code ${code} would be sent to ${destination}`)
      
      return NextResponse.json({ success: true, method: "sms", demo: true })
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
