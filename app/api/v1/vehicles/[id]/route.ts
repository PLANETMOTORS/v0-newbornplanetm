import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_STATUSES = new Set([
  "available",
  "reserved",
  "pending",
  "sold",
  "maintenance",
])

function toPublicVehicle(vehicle: Record<string, unknown>) {
  const price = typeof vehicle.price === "number" ? vehicle.price / 100 : null
  const msrp = typeof vehicle.msrp === "number" ? vehicle.msrp / 100 : null

  return {
    ...vehicle,
    price,
    msrp,
  }
}

// GET /api/v1/vehicles/:id - Get vehicle details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("*")
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

    return NextResponse.json({
      success: true,
      data: {
        vehicle: toPublicVehicle(vehicle),
      },
    })
  } catch (error) {
    console.error("Vehicle details error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch vehicle" } },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/vehicles/:id/status - Update vehicle status (internal)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const status = String(body?.status || "")

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: "Invalid status value" } },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("vehicles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status, updated_at")
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Vehicle not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        status: data.status,
        updatedAt: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Vehicle status update error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update status" } },
      { status: 500 }
    )
  }
}