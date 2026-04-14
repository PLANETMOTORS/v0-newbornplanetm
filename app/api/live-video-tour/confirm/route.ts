import { NextResponse } from "next/server"
import { confirmLiveVideoTourBooking } from "@/lib/liveVideoTour/service"
import { validateOrigin } from "@/lib/csrf"

// POST /api/live-video-tour/confirm
// Manually confirms a booking (for approval flow)
export async function POST(req: Request) {
  try {
    if (!validateOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }
    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Booking ID is required" },
        { status: 400 }
      )
    }

    const result = await confirmLiveVideoTourBooking(bookingId)
    
    return NextResponse.json(result, { 
      status: result.ok ? 200 : 400 
    })
  } catch (error) {
    console.error("[liveVideoTour] Confirm error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to confirm booking" },
      { status: 500 }
    )
  }
}
