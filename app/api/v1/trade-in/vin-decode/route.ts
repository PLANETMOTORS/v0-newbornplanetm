import { NextRequest, NextResponse } from "next/server"
import { mapDrivetrain, mapFuelType } from "@/lib/vin/mappers"

/**
 * Public VIN Decoder for trade-in flow.
 * Uses the free NHTSA vPIC API — no auth required.
 * Read-only GET endpoint with no side effects; CSRF not needed.
 * NHTSA itself rate-limits; our 24h cache further reduces upstream calls.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vin = searchParams.get("vin")?.trim().toUpperCase()

    if (vin?.length !== 17) {
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

    // NHTSA error codes: 0 = OK, 1 = check-digit warning, 5/6 = partial data
    // Only fail if we didn't get the essential fields (make + model)
    const hasCriticalData = r.Make && r.Model && r.ModelYear
    if (!hasCriticalData) {
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

