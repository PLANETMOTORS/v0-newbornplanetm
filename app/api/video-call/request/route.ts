import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/redis"
import { createLiveVideoTourBooking } from "@/lib/liveVideoTour/service"

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const body = await req.json()

    const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : ""
    const limiterKey = customerEmail ? `video-call:${ip}:${customerEmail}` : `video-call:${ip}`
    const limiter = await rateLimit(limiterKey, 8, 3600)

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { vehicleId, vehicleName, customerName, customerPhone, preferredTime, notes } = body

    // Validate required fields
    if (!vehicleId || !customerName || !customerEmail || !customerPhone || !preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const bookingResult = await createLiveVideoTourBooking({
      vehicleId,
      vehicleName,
      customerName,
      customerEmail,
      customerPhone,
      preferredTime,
      timezone: "America/Toronto",
      provider: "google_meet",
      notes,
    })

    if (!bookingResult.ok) {
      return NextResponse.json(
        { error: bookingResult.error || "Unable to schedule video call" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Video call scheduled successfully",
      data: {
        callId: bookingResult.bookingId,
        joinLink: bookingResult.joinUrl,
        scheduledTime: bookingResult.scheduledTime,
        provider: bookingResult.provider,
      },
    })
  } catch (error) {
    console.error("Video call request error:", error)
    return NextResponse.json(
      { error: "Failed to schedule video call" },
      { status: 500 }
    )
  }
}
