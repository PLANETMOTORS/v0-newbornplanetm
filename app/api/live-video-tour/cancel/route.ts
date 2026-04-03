import { NextResponse } from "next/server"
import { cancelLiveVideoTourBooking } from "@/lib/liveVideoTour/service"

// POST /api/live-video-tour/cancel
// Cancels an existing booking
export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Booking ID is required" },
        { status: 400 }
      )
    }

    const result = await cancelLiveVideoTourBooking(bookingId)
    
    return NextResponse.json(result, { 
      status: result.ok ? 200 : 400 
    })
  } catch (error) {
    console.error("[liveVideoTour] Cancel error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to cancel booking" },
      { status: 500 }
    )
  }
}
