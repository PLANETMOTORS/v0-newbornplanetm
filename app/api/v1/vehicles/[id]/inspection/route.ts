import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/vehicles/:id/inspection - Get persisted inspection summary
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("id, stock_number, vin, year, make, model, trim, inspection_score, inspection_date, is_certified, updated_at")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Vehicle not found" } },
        { status: 404 }
      )
    }

    const score = typeof vehicle.inspection_score === "number" ? vehicle.inspection_score : null
    const inspectionDate = vehicle.inspection_date ? String(vehicle.inspection_date) : null

    if (score === null || !inspectionDate) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Inspection report not available" } },
        { status: 404 }
      )
    }

    const totalPoints = 210
    const passRate = Math.max(0, Math.min(100, score))
    const passedPoints = Math.round((passRate / 100) * totalPoints)

    return NextResponse.json({
      success: true,
      data: {
        inspection: {
          id: `inspection-${vehicle.id}`,
          vehicleId: vehicle.id,
          stockNumber: vehicle.stock_number,
          vin: vehicle.vin,
          vehicleName: [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
            .filter(Boolean)
            .join(" "),
          inspectionDate,
          score,
          passRate,
          totalPoints,
          passedPoints,
          overallStatus: passRate >= 85 ? "passed" : "needs_review",
          isCertified: Boolean(vehicle.is_certified),
          reportSource: "vehicles.inspection_score",
          reportLastUpdatedAt: vehicle.updated_at,
        },
      },
    })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch inspection" } },
      { status: 500 }
    )
  }
}
