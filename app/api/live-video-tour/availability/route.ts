import { NextResponse } from "next/server"
import { getAvailableDates, getAvailableSlots } from "@/lib/liveVideoTour/availability"

// GET /api/live-video-tour/availability
// Returns available dates and time slots
// Optional query param: ?date=2026-04-03 for specific date slots
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const specificDate = searchParams.get("date")

    if (specificDate) {
      // Validate YYYY-MM-DD format and that it is a real calendar date
      const dateFormatOk = /^\d{4}-\d{2}-\d{2}$/.test(specificDate)
      if (!dateFormatOk || isNaN(new Date(`${specificDate}T12:00:00Z`).getTime())) {
        return NextResponse.json(
          { ok: false, error: "Invalid date format. Use YYYY-MM-DD." },
          { status: 400 }
        )
      }

      // Pass the date string directly so availability is evaluated in dealership timezone
      const slots = getAvailableSlots(specificDate)
      return NextResponse.json({
        ok: true,
        date: specificDate,
        slots: slots.filter((s) => s.available),
      })
    }

    // Return all available dates with slots
    const availability = getAvailableDates()
    return NextResponse.json({
      ok: true,
      availability,
    })
  } catch (error) {
    console.error("[liveVideoTour] Availability error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to get availability" },
      { status: 500 }
    )
  }
}
