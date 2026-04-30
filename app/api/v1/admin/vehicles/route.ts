import { NextRequest, NextResponse } from "next/server"
import {
  authenticateAdmin,
  getSearchParams,
  parsePagination,
  sanitizeSearch,
} from "@/lib/admin-api"
import { pingVehicleChange } from "@/lib/seo/indexnow"

/**
 * Admin Vehicle Management API
 * GET  — list vehicles (paginated, searchable, filterable)
 * POST — create a new vehicle
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin()
    if (!auth.ok) return auth.response
    const { adminClient } = auth

    const searchParams = getSearchParams(request)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const sort = searchParams.get("sort") || "updated_at"
    const order = searchParams.get("order") || "desc"
    const { limit, offset } = parsePagination(searchParams)

    // Build query
    let query = adminClient
      .from("vehicles")
      .select("*", { count: "exact" })
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1)

    // Status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Search filter
    if (search) {
      const s = sanitizeSearch(search)
      if (s) {
        query = query.or(
          `vin.ilike.%${s}%,stock_number.ilike.%${s}%,make.ilike.%${s}%,model.ilike.%${s}%,trim.ilike.%${s}%`
        )
      }
    }

    const { data: vehicles, error, count } = await query

    if (error) {
      console.error("Error fetching vehicles:", error)
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
    }

    // Get status counts for stats cards
    const statusCounts = { available: 0, reserved: 0, pending: 0, sold: 0 }
    const countPromises = (Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map(async (s) => {
      const { count: c } = await adminClient
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("status", s)
      return { status: s, count: c ?? 0 }
    })
    const counts = await Promise.all(countPromises)
    for (const c of counts) {
      statusCounts[c.status] = c.count
    }

    // Get total vehicle count
    const { count: totalCount } = await adminClient
      .from("vehicles")
      .select("id", { count: "exact", head: true })

    return NextResponse.json({
      vehicles: vehicles || [],
      total: count ?? 0,
      totalVehicles: totalCount ?? 0,
      statusCounts,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Admin vehicles GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin()
    if (!auth.ok) return auth.response
    const { adminClient } = auth

    const body = await request.json()

    // Validate required fields
    const required = ["stock_number", "vin", "year", "make", "model", "price", "mileage"]
    const missing = required.filter(f => !body[f] && body[f] !== 0)
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 })
    }

    // Validate VIN
    if (typeof body.vin !== "string" || body.vin.length !== 17) {
      return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
    }

    // Check for duplicate VIN
    const { data: existing } = await adminClient
      .from("vehicles")
      .select("id")
      .eq("vin", body.vin.toUpperCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A vehicle with this VIN already exists" }, { status: 409 })
    }

    // Build vehicle record
    const vehicle = {
      stock_number: body.stock_number,
      vin: body.vin.toUpperCase(),
      year: Number.parseInt(body.year),
      make: body.make,
      model: body.model,
      trim: body.trim || null,
      body_style: body.body_style || null,
      exterior_color: body.exterior_color || null,
      interior_color: body.interior_color || null,
      price: Number.parseInt(body.price),
      msrp: body.msrp ? Number.parseInt(body.msrp) : null,
      mileage: Number.parseInt(body.mileage),
      drivetrain: body.drivetrain || null,
      transmission: body.transmission || null,
      engine: body.engine || null,
      fuel_type: body.fuel_type || null,
      fuel_economy_city: body.fuel_economy_city ? Number.parseInt(body.fuel_economy_city) : null,
      fuel_economy_highway: body.fuel_economy_highway ? Number.parseInt(body.fuel_economy_highway) : null,
      is_ev: body.is_ev ?? false,
      battery_capacity_kwh: body.battery_capacity_kwh ? Number.parseFloat(body.battery_capacity_kwh) : null,
      range_miles: body.range_miles ? Number.parseInt(body.range_miles) : null,
      status: body.status || "available",
      is_certified: body.is_certified ?? false,
      is_new_arrival: body.is_new_arrival ?? true,
      featured: body.featured ?? false,
      has_360_spin: body.has_360_spin ?? false,
      primary_image_url: body.primary_image_url || null,
      image_urls: body.image_urls || null,
      video_url: body.video_url || null,
      location: body.location || "Richmond Hill, ON",
    }

    const { data, error } = await adminClient
      .from("vehicles")
      .insert(vehicle)
      .select()
      .single()

    if (error) {
      console.error("Error creating vehicle:", error)
      return NextResponse.json({ error: "Failed to create vehicle", details: error.message }, { status: 500 })
    }

    // Notify search engines that a new VDP + the inventory listing
    // exist. Non-blocking — IndexNow failures must never cascade into
    // a 500 for the admin user.
    const indexNow = await pingVehicleChange(data.id)

    return NextResponse.json(
      {
        success: true,
        vehicle: data,
        indexNow: { ok: indexNow.ok, count: indexNow.count },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Admin vehicles POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
