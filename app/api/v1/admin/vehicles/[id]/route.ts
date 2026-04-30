import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"
import { asScalarString } from "@/lib/safe-coerce"
import { pingVehicleChange } from "@/lib/seo/indexnow"

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

const ALLOWED_VEHICLE_UPDATE_FIELDS = [
  "stock_number", "vin", "year", "make", "model", "trim", "body_style",
  "exterior_color", "interior_color", "price", "msrp", "mileage",
  "drivetrain", "transmission", "engine", "fuel_type",
  "fuel_economy_city", "fuel_economy_highway", "is_ev",
  "battery_capacity_kwh", "range_miles", "status", "is_certified",
  "is_new_arrival", "featured", "has_360_spin",
  "primary_image_url", "image_urls", "video_url", "location",
  "inspection_score", "inspection_date",
  "ev_battery_health_percent",
] as const

const VEHICLE_INT_FIELDS = [
  "year", "price", "msrp", "mileage", "fuel_economy_city", "fuel_economy_highway",
  "range_miles", "inspection_score", "ev_battery_health_percent", "savings",
] as const

function buildVehicleUpdate(body: Record<string, unknown>): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  for (const field of ALLOWED_VEHICLE_UPDATE_FIELDS) {
    if (field in body) update[field] = body[field]
  }
  for (const f of VEHICLE_INT_FIELDS) {
    if (f in update && update[f] !== null) {
      update[f] = Number.parseInt(asScalarString(update[f]))
    }
  }
  if ("battery_capacity_kwh" in update && update.battery_capacity_kwh !== null) {
    update.battery_capacity_kwh = Number.parseFloat(asScalarString(update.battery_capacity_kwh))
  }
  return update
}

async function validateVinForUpdate(
  adminClient: ReturnType<typeof createAdminClient>,
  vehicleId: string,
  rawVin: unknown,
): Promise<{ ok: true; normalised: string } | { ok: false; res: NextResponse }> {
  if (typeof rawVin !== "string") return { ok: true, normalised: "" }
  const normalised = rawVin.toUpperCase()
  if (normalised.length !== 17) {
    return { ok: false, res: NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 }) }
  }
  const { data: existingVin } = await adminClient
    .from("vehicles")
    .select("id")
    .eq("vin", normalised)
    .neq("id", vehicleId)
    .maybeSingle()
  if (existingVin) {
    return { ok: false, res: NextResponse.json({ error: "A vehicle with this VIN already exists" }, { status: 409 }) }
  }
  return { ok: true, normalised }
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
    const update = buildVehicleUpdate(body)
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const vinResult = await validateVinForUpdate(adminClient, id, update.vin)
    if (!vinResult.ok) return vinResult.res
    if (vinResult.normalised) update.vin = vinResult.normalised

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

    // Notify search engines that this VDP + the inventory listing
    // changed. Non-blocking — IndexNow failures must never cascade
    // into a 500 for the admin user.
    const indexNow = await pingVehicleChange(id)

    return NextResponse.json({
      success: true,
      vehicle: data,
      indexNow: { ok: indexNow.ok, count: indexNow.count },
    })
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

    // Notify search engines that the VDP is gone and the inventory
    // listing changed. Same non-blocking semantics as PUT.
    const indexNow = await pingVehicleChange(id)

    return NextResponse.json({
      success: true,
      message: `Deleted ${existing.year} ${existing.make} ${existing.model} (${existing.vin})`,
      indexNow: { ok: indexNow.ok, count: indexNow.count },
    })
  } catch (error) {
    console.error("Admin vehicle DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
