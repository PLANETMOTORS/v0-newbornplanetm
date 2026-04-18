import { NextRequest, NextResponse } from "next/server"
import { validateOrigin } from "@/lib/csrf"

/**
 * Public VIN Decoder for trade-in flow.
 * Uses the free NHTSA vPIC API — no auth required.
 * Returns only the fields needed for trade-in: year, make, model, trim.
 */

export async function GET(request: NextRequest) {
  try {
    // CSRF check to prevent abuse
    if (!validateOrigin(request)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const vin = searchParams.get("vin")?.trim().toUpperCase()

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { success: false, error: "VIN must be exactly 17 characters" },
        { status: 400 }
      )
    }

    // Basic VIN format validation (alphanumeric, no I/O/Q)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      return NextResponse.json(
        { success: false, error: "Invalid VIN format" },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Vehicle lookup service unavailable" },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (!data.Results || data.Results.length === 0) {
      return NextResponse.json(
        { success: false, error: "No vehicle found for this VIN" },
        { status: 404 }
      )
    }

    const r = data.Results[0]

    // Check for NHTSA errors
    const errorCode = r.ErrorCode || ""
    if (errorCode && !errorCode.split(",").includes("0")) {
      return NextResponse.json(
        { success: false, error: "Could not decode this VIN. Please check and try again." },
        { status: 400 }
      )
    }

    // Return only trade-in relevant fields
    return NextResponse.json({
      success: true,
      vehicle: {
        vin,
        year: r.ModelYear || "",
        make: r.Make || "",
        model: r.Model || "",
        trim: r.Trim || r.Series || "",
        bodyStyle: r.BodyClass || "",
        fuelType: mapFuelType(r.FuelTypePrimary || ""),
        drivetrain: mapDrivetrain(r.DriveType || ""),
      },
    })
  } catch (error) {
    console.error("Trade-in VIN decode error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to decode VIN" },
      { status: 500 }
    )
  }
}

function mapDrivetrain(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("all wheel") || lower.includes("awd") || lower.includes("4wd")) return "AWD"
  if (lower.includes("front wheel") || lower.includes("fwd")) return "FWD"
  if (lower.includes("rear wheel") || lower.includes("rwd")) return "RWD"
  if (lower.includes("4x4") || lower.includes("four wheel")) return "4WD"
  return raw
}

function mapFuelType(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("gasoline")) return "Gasoline"
  if (lower.includes("diesel")) return "Diesel"
  if (lower.includes("electric")) return "Electric"
  if (lower.includes("hybrid") || lower.includes("plug-in")) return "Hybrid"
  return raw
}
