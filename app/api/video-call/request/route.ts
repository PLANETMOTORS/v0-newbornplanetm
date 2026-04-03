import { NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { vehicleId, vehicleName, customerName, customerEmail, customerPhone, preferredTime, notes } = await req.json()

    // Validate required fields
    if (!vehicleId || !customerName || !customerEmail || !customerPhone || !preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate a unique call ID
    const callId = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // In production, this would:
    // 1. Save to database
    // 2. Send email/SMS to customer with join link
    // 3. Notify sales team
    // 4. Schedule in calendar

    const videoCallRequest = {
      callId,
      vehicleId,
      vehicleName,
      customerName,
      customerEmail,
      customerPhone,
      preferredTime,
      notes,
      status: "scheduled",
      joinLink: `https://meet.planetmotors.ca/${callId}`,
      createdAt: new Date().toISOString(),
    }

    // Send notification email to admin
    await sendNotificationEmail({
      type: 'test_drive_request',
      customerName,
      customerEmail,
      customerPhone,
      vehicleInfo: vehicleName,
      additionalData: { callId, preferredTime, notes, type: 'Video Call Request' },
    })

    return NextResponse.json({
      success: true,
      message: "Video call scheduled successfully",
      data: {
        callId,
        joinLink: videoCallRequest.joinLink,
        scheduledTime: preferredTime,
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
