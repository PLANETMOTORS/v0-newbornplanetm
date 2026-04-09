import { NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"
import { rateLimit } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`contact:${ip}`, 5, 3600)
    if (!limiter.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, postalCode, subject, message } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !postalCode || !message) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate phone (10 digits)
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 }
      )
    }

    // Validate Canadian postal code
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/i
    if (!postalCodeRegex.test(postalCode)) {
      return NextResponse.json(
        { success: false, error: "Invalid Canadian postal code" },
        { status: 400 }
      )
    }

    // Send email notification
    await sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: `${firstName} ${lastName}`,
      customerEmail: email,
      customerPhone: phone,
      additionalData: {
        subject: subject || "General Inquiry",
        message,
        postalCode,
        source: "Contact Form",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Your message has been sent. We'll respond within 2 hours.",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    )
  }
}
