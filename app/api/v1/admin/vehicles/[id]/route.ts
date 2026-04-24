import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

/**
 * Admin Single Vehicle API
 * GET    — fetch a single vehicle
 * PUT    — update a vehicle
 * DELETE — delete a vehicle
 */

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return null
  }
  return user
}

const VEHICLE_ALLOWED_UPDATE_FIELDS = [
  "stock_number", "vin", "year", "make", "model", "trim", "body_style",
  "exterior_color", "interior_color", "price", "msrp", "mileage",
  "drivetrain", "transmission", "engine", "fuel_type",
  "fuel_economy_city", "fuel_economy_highway", "is_ev",
  "battery_capacity_kwh", "range_miles", "status", "is_certified",
  "is_new_arrival", "featured", "has_360_spin",
  "primary_image_url", "image_urls", "video_url", "location",
  "inspection_score", "inspection_date", "ev_battery_health_percent",
]

function buildVehicleUpdateFields(body: Record<string, unknown>, allowedFields: string[]): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field]
  }
  return update
}

function coerceNumericFields(update: Record<string, unknown>): void {
  const intFields = ["year", "price", "msrp", "mileage", "fuel_economy_city", "fuel_economy_highway", "range_miles", "inspection_score", "ev_battery_health_percent", "savings"]
  for (const f of intFields) {
    if (f in update && update[f] !== null) update[f] = parseInt(String(update[f]))
  }
  if ("battery_capacity_kwh" in update && update.battery_capacity_kwh !== null) {
    update.battery_capacity_kwh = parseFloat(String(update.battery_capacity_kwh))
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    const { data, error } = await adminClient
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    return NextResponse.json({ vehicle: data })
  } catch (error) {
    console.error("Admin vehicle GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    const body = await request.json()

    const update = buildVehicleUpdateFields(body, VEHICLE_ALLOWED_UPDATE_FIELDS)

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Uppercase VIN if provided and validate
    if (typeof update.vin === "string") {
      update.vin = (update.vin as string).toUpperCase()
      if ((update.vin as string).length !== 17) {
        return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
      }
      // Check for duplicate VIN (excluding current vehicle)
      const { data: existingVin } = await adminClient
        .from("vehicles")
        .select("id")
        .eq("vin", update.vin as string)
        .neq("id", id)
        .maybeSingle()
      if (existingVin) {
        return NextResponse.json({ error: "A vehicle with this VIN already exists" }, { status: 409 })
      }
    }

    // Numeric conversions
    coerceNumericFields(update)

    update.updated_at = new Date().toISOString()

    const { data, error } = await adminClient
      .from("vehicles")
      .update(update)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating vehicle:", error)
      return NextResponse.json({ error: "Failed to update vehicle", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, vehicle: data })
  } catch (error) {
    console.error("Admin vehicle PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    // Check if vehicle exists first
    const { data: existing } = await adminClient
      .from("vehicles")
      .select("id, vin, year, make, model")
      .eq("id", id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const { error } = await adminClient
      .from("vehicles")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting vehicle:", error)
      return NextResponse.json({ error: "Failed to delete vehicle", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${existing.year} ${existing.make} ${existing.model} (${existing.vin})`,
    })
  } catch (error) {
    console.error("Admin vehicle DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
