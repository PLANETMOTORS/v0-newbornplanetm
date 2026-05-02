import { NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"
import { rateLimit } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"
import { trackSchedule } from "@/lib/meta-capi-helpers"

export async function POST(req: Request) {
  try {
    // CSRF protection
    if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit: 5 video call requests per hour per IP
    const forwarded = req.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`video-call:${ip}`, 5, 3600)
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { vehicleId, vehicleName, customerName, customerEmail, customerPhone, preferredTime, notes } = await req.json()

    // Validate required fields
    if (!vehicleId || !customerName || !customerEmail || !customerPhone || !preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate a unique call ID
    const callId = `VC-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

    // In production, this would:
    // 1. Save to database
    // 2. Send email/SMS to customer with join link
    // 3. Notify sales team
    // 4. Schedule in calendar

    // Send notification email to admin — the team will follow up with a meeting link
    await sendNotificationEmail({
      type: 'test_drive_request',
      customerName,
      customerEmail,
      customerPhone,
      vehicleInfo: vehicleName,
      additionalData: { callId, preferredTime, notes, type: 'Video Call Request' },
    })

    // Fire Meta CAPI Schedule event (non-blocking)
    trackSchedule(req, {
      email: customerEmail,
      phone: customerPhone,
      firstName: customerName,
      contentName: vehicleName || `Vehicle ${vehicleId}`,
    })

    return NextResponse.json({
      success: true,
      message: "Video call request received! Our team will email you a meeting link shortly.",
      data: {
        callId,
        scheduledTime: preferredTime,
        _note: "A team member will send you the video call link via email before your scheduled time.",
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
