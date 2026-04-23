import { NextResponse } from "next/server"
import { getAvailableDates, getAvailableSlots, normalizeIsoDate } from "@/lib/liveVideoTour/availability"

// GET /api/live-video-tour/availability
// Returns available dates and time slots
// Optional query param: ?date=2026-04-03 for specific date slots
export function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const specificDate = searchParams.get("date")

    if (specificDate) {
      // Return slots for a specific date
      const normalizedDate = normalizeIsoDate(specificDate)
      if (!normalizedDate) {
        return NextResponse.json(
          { ok: false, error: "Invalid date format" },
          { status: 400 }
        )
      }

      const slots = getAvailableSlots(normalizedDate)
      return NextResponse.json({
        ok: true,
        date: normalizedDate,
        slots: slots.filter(s => s.available),
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
