import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_SPIN_FRAME_COUNT = 72
const MIN_SPIN_FRAME_COUNT = 24

function resolveFrameCount(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10)
  if (!Number.isFinite(numeric)) return DEFAULT_SPIN_FRAME_COUNT
  return Math.max(MIN_SPIN_FRAME_COUNT, numeric)
}

function sanitizeStockNumber(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("id, stock_number, has_360_spin, primary_image_url, updated_at, status, spin_frame_count")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: "Database query failed" } },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Vehicle not found" } },
        { status: 404 }
      )
    }

    if (vehicle.has_360_spin !== true) {
      return NextResponse.json(
        { success: false, error: { code: "SPIN_NOT_AVAILABLE", message: "360 spin not available for this vehicle" } },
        { status: 404 }
      )
    }

    const stockNumber = sanitizeStockNumber(vehicle.stock_number)
    if (!stockNumber) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_STOCK_NUMBER", message: "Vehicle stock number is missing" } },
        { status: 422 }
      )
    }

    const frameCount = resolveFrameCount(vehicle.spin_frame_count)

    const manifest = {
      vehicleId: vehicle.id,
      stockNumber,
      provider: "driveai",
      version: "v1",
      frameCount,
      frameTemplate: `vehicles/${stockNumber}/360/frame-{frame}.jpg`,
      previewUrl: vehicle.primary_image_url || null,
      updatedAt: vehicle.updated_at || null,
      vehicleStatus: vehicle.status || null,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          manifest,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    )
  } catch (error) {
    console.error("Unexpected error in spin-manifest route:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    )
  }
}
