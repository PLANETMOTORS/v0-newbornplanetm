import { NextResponse } from "next/server"
import { createLiveVideoTourBooking } from "@/lib/liveVideoTour/service"

// GET /api/live-video-tour/test
// Triggers a test booking to verify email notifications
export async function GET() {
  const testData = {
    vehicleId: "test-vehicle-123",
    vehicleName: "2024 BMW X5 xDrive40i",
    customerName: "Test User",
    customerEmail: "info@planetmotors.ca",
    customerPhone: "4165551234",
    preferredTime: "2026-04-07T10:00:00-04:00",
    timezone: "America/Toronto",
    provider: "google_meet" as const,
    notes: "Test booking triggered from v0 to verify email system"
  }

  console.log("[v0] Triggering test Live Video Tour booking...")
  
  try {
    const result = await createLiveVideoTourBooking(testData)
    console.log("[v0] Test booking result:", result)
    
    return NextResponse.json({
      message: "Test booking triggered",
      result,
      sentTo: testData.customerEmail
    })
  } catch (error) {
    console.error("[v0] Test booking error:", error)
    return NextResponse.json({
      message: "Test booking failed",
      error: String(error)
    }, { status: 500 })
  }
}
