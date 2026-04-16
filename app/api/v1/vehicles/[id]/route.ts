import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getCachedSearchResults, cacheSearchResults, deleteCachedSearchResults } from "@/lib/redis"

const ADMIN_EMAILS = ["admin@planetmotors.ca", "toni@planetmotors.ca"]
const VEHICLE_DETAIL_TTL = 300 // 5 minutes

const ALLOWED_STATUSES = new Set([
  "available",
  "reserved",
  "pending",
  "sold",
  "maintenance",
])

const VEHICLE_DETAIL_FIELDS = [
  'id',
  'stock_number',
  'vin',
  'year',
  'make',
  'model',
  'trim',
  'body_style',
  'exterior_color',
  'interior_color',
  'price',
  'msrp',
  'mileage',
  'drivetrain',
  'transmission',
  'engine',
  'fuel_type',
  'status',
  'location',
  'primary_image_url',
  'image_urls',
  'has_360_spin',
  'video_url',
  'is_certified',
  'is_new_arrival',
  'featured',
  'inspection_score',
  'inspection_date',
  'is_ev',
  'battery_capacity_kwh',
  'range_miles',
  'ev_battery_health_percent',
  'created_at',
  'updated_at',
].join(',')

// Drivee.ai VIN → media ID mapping
// These are the vehicles that have been photographed with Drivee's 360° system.
// The dealer UID is AZYuEtjX9NUvWpqmUQcKyiGHbNg1.
// To add more, photograph vehicles via the Drivee app and add VIN → mid here.
const DRIVEE_VIN_MAP: Record<string, string> = {
  // Current inventory — mapped from Drivee photography sessions
  "1C4JJXP6XMW777356": "190171976531",  // 2021 Jeep Wrangler 4xe (lot unit)
  "1C4JJXP60MW777382": "190171976531",  // 2021 Jeep Wrangler 4xe (second unit)
  "3GN7DSRR5SS127703": "744761075195",  // 2025 Chevrolet Equinox EV
  "5YJ3E1EA3MF848712": "132601940353",  // 2021 Tesla Model 3
  // Legacy VINs (may have been sold)
  "1C4JXRN68MW508009": "190171976531",  // 2021 Jeep Wrangler 4xe (sold)
  "3VV4B7AX1SM019897": "744761075195",  // 2025 Chevrolet Equinox EV (sold)
  "5YJ3E1EB4MF062024": "132601940353",  // 2021 Tesla Model 3 (sold)
}

function toPublicVehicle(vehicle: Record<string, unknown>) {
  const price = typeof vehicle.price === "number" ? vehicle.price / 100 : null
  const msrp = typeof vehicle.msrp === "number" ? vehicle.msrp / 100 : null
  const vin = typeof vehicle.vin === "string" ? vehicle.vin : ""
  const drivee_mid = DRIVEE_VIN_MAP[vin] || null

  return {
    ...vehicle,
    price,
    msrp,
    drivee_mid,
  }
}

// GET /api/v1/vehicles/:id - Get vehicle details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cacheKey = `vehicles:detail:${id}`

    // Serve from Redis when available
    const cached = await getCachedSearchResults(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': `public, s-maxage=${VEHICLE_DETAIL_TTL}, stale-while-revalidate=${VEHICLE_DETAIL_TTL * 2}`,
          'X-Cache': 'HIT',
        },
      })
    }

    let supabase: Awaited<ReturnType<typeof createClient>>
    try {
      supabase = await createClient()
    } catch {
      // Supabase not configured — return mock vehicle for local development
      const mock = getMockVehicleDetail(id)
      if (mock) {
        return NextResponse.json({ success: true, data: { vehicle: mock } }, {
          headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MOCK' },
        })
      }
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Vehicle not found" } },
        { status: 404 }
      )
    }

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select(VEHICLE_DETAIL_FIELDS)
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

    const responseBody = {
      success: true,
      data: {
        vehicle: toPublicVehicle(vehicle as unknown as Record<string, unknown>),
      },
    }

    // Cache the result
    await cacheSearchResults(cacheKey, responseBody, VEHICLE_DETAIL_TTL)

    return NextResponse.json(responseBody, {
      headers: {
        'Cache-Control': `public, s-maxage=${VEHICLE_DETAIL_TTL}, stale-while-revalidate=${VEHICLE_DETAIL_TTL * 2}`,
        'X-Cache': 'MISS',
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    }

    if (!ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
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

    // Invalidate cached vehicle detail and facets so stale data isn't served
    await Promise.allSettled([
      deleteCachedSearchResults(`vehicles:detail:${id}`),
      deleteCachedSearchResults('vehicles:facets:snapshot'),
    ])

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

// Mock vehicle detail for local development when Supabase is unavailable
function getMockVehicleDetail(id: string) {
  const mocks: Record<string, Record<string, unknown>> = {
    "mock-tesla-3": { id: "mock-tesla-3", year: 2024, make: "Tesla", model: "Model 3", trim: "Long Range AWD", price: 54995, msrp: 57995, mileage: 8200, fuel_type: "Electric", body_style: "Sedan", transmission: "Automatic", drivetrain: "AWD", exterior_color: "Pearl White", interior_color: "Black", primary_image_url: "/placeholder.jpg", image_urls: ["/placeholder.jpg", "/placeholder-user.jpg", "/placeholder-logo.png"], status: "available", stock_number: "PM-2024-001", vin: "5YJ3E1EA1PF000001", is_certified: true, is_new_arrival: true, is_ev: true, battery_capacity_kwh: 82, range_miles: 358, ev_battery_health_percent: 98, inspection_score: 195, engine: "Dual Motor Electric", features: ["Autopilot", "Premium Interior", "Long Range Battery"], description: "2024 Tesla Model 3 Long Range AWD in excellent condition." },
    "mock-tesla-y": { id: "mock-tesla-y", year: 2024, make: "Tesla", model: "Model Y", trim: "Performance", price: 61995, msrp: 63995, mileage: 5100, fuel_type: "Electric", body_style: "SUV", transmission: "Automatic", drivetrain: "AWD", exterior_color: "Midnight Silver", interior_color: "White", primary_image_url: "/placeholder.jpg", image_urls: ["/placeholder.jpg", "/placeholder.jpg"], status: "available", stock_number: "PM-2024-002", vin: "5YJ3E1EA1PF000002", is_certified: true, is_new_arrival: false, is_ev: true, battery_capacity_kwh: 75, range_miles: 303, ev_battery_health_percent: 99, inspection_score: 200, engine: "Dual Motor Electric", features: ["Performance Package", "Full Self-Driving"], description: "2024 Tesla Model Y Performance." },
    "mock-bmw-i4": { id: "mock-bmw-i4", year: 2023, make: "BMW", model: "i4", trim: "eDrive40", price: 52995, msrp: 56995, mileage: 12300, fuel_type: "Electric", body_style: "Sedan", transmission: "Automatic", drivetrain: "RWD", exterior_color: "Black Sapphire", interior_color: "Cognac", primary_image_url: "/placeholder.jpg", image_urls: ["/placeholder.jpg"], status: "available", stock_number: "PM-2024-003", vin: "WBA53BJ01PCK00003", is_certified: true, is_new_arrival: false, is_ev: true, battery_capacity_kwh: 83.9, range_miles: 301, ev_battery_health_percent: 97, inspection_score: 188, engine: "Single Motor Electric", features: ["iDrive 8", "Driving Assistant Pro"], description: "2023 BMW i4 eDrive40." },
  }
  return mocks[id] || null
}
