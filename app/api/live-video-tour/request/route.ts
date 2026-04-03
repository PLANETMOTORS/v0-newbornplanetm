import { NextResponse } from "next/server"
import { createLiveVideoTourBooking } from "@/lib/liveVideoTour/service"

// POST /api/live-video-tour/request
// Creates a new live video tour booking
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createLiveVideoTourBooking(body)
    
    return NextResponse.json(result, { 
      status: result.ok ? 200 : 400 
    })
  } catch (error) {
    console.error("[liveVideoTour] Request error:", error)
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
