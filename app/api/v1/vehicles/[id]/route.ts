import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = ["admin@planetmotors.ca", "toni@planetmotors.ca"]

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

function sanitizeStockNumber(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function toPublicVehicle(vehicle: Record<string, unknown>) {
  const price = typeof vehicle.price === "number" ? vehicle.price / 100 : null
  const msrp = typeof vehicle.msrp === "number" ? vehicle.msrp / 100 : null
  const has360Spin = vehicle.has_360_spin === true
  const stockNumber = sanitizeStockNumber(vehicle.stock_number)
  const configuredFrameCount = asNumber(vehicle.spin_frame_count)
  const spinFrameCount = has360Spin ? Math.max(24, configuredFrameCount || 72) : null
  const spinFrameTemplate = has360Spin && stockNumber
    ? `vehicles/${stockNumber}/360/frame-{frame}.jpg`
    : null
  const spinPreviewUrl = has360Spin
    ? (typeof vehicle.primary_image_url === 'string' ? vehicle.primary_image_url : null)
    : null
  const spinManifestVersion = has360Spin ? 'v1' : null
  const mediaProvider = has360Spin ? 'driveai' : null

  return {
    ...vehicle,
    price,
    msrp,
    media_provider: mediaProvider,
    spin_frame_count: spinFrameCount,
    spin_frame_template: spinFrameTemplate,
    spin_preview_url: spinPreviewUrl,
    spin_last_synced_at: vehicle.updated_at || null,
    spin_manifest_version: spinManifestVersion,
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

    return NextResponse.json(
      {
        success: true,
        data: {
          vehicle: toPublicVehicle(vehicle as unknown as Record<string, unknown>),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=1800',
        },
      }
    )
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