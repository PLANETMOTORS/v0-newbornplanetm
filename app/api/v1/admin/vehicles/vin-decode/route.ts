import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

/**
 * VIN Decoder using the free NHTSA vPIC API.
 * Decodes VIN → year, make, model, trim, body style, drivetrain, engine, fuel type, etc.
 * https://vpic.nhtsa.dot.gov/api/
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vin = searchParams.get("vin")?.trim().toUpperCase()

    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
    }

    // Call NHTSA API
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )

    if (!response.ok) {
      return NextResponse.json({ error: "NHTSA API error" }, { status: 502 })
    }

    const data = await response.json()
    const results: Record<string, string> = {}

    if (data.Results && data.Results.length > 0) {
      const r = data.Results[0]
      // Map NHTSA fields to our vehicle fields
      results.vin = vin
      results.year = r.ModelYear || ""
      results.make = r.Make || ""
      results.model = r.Model || ""
      results.trim = r.Trim || r.Series || ""
      results.body_style = r.BodyClass || ""
      results.drivetrain = mapDrivetrain(r.DriveType || "")
      results.transmission = mapTransmission(r.TransmissionStyle || "")
      results.engine = buildEngineString(r)
      results.fuel_type = mapFuelType(r.FuelTypePrimary || "")
      results.is_ev = String(
        (r.FuelTypePrimary || "").toLowerCase().includes("electric") ||
        (r.ElectrificationLevel || "").toLowerCase().includes("bev")
      )
      results.doors = r.Doors || ""

      // EV-specific fields
      if (results.is_ev === "true") {
        results.battery_capacity_kwh = r.BatteryKWh || ""
        results.range_miles = r.ElectricRange || ""
      }

      // Error check from NHTSA
      const errorCode = r.ErrorCode || ""
      if (errorCode && errorCode !== "0") {
        results.decode_error = r.ErrorText || "VIN decode returned errors"
        results.error_code = errorCode
      }
    }

    return NextResponse.json({ success: true, decoded: results })
  } catch (error) {
    console.error("VIN decode error:", error)
    return NextResponse.json({ error: "Failed to decode VIN" }, { status: 500 })
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

function mapTransmission(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("automatic")) return "Automatic"
  if (lower.includes("manual")) return "Manual"
  if (lower.includes("cvt")) return "CVT"
  if (lower.includes("dual clutch") || lower.includes("dct")) return "DCT"
  return raw
}

function mapFuelType(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("gasoline")) return "Gasoline"
  if (lower.includes("diesel")) return "Diesel"
  if (lower.includes("electric")) return "Electric"
  if (lower.includes("hybrid") || lower.includes("plug-in")) return "Hybrid"
  if (lower.includes("hydrogen") || lower.includes("fuel cell")) return "Hydrogen"
  return raw
}

function buildEngineString(r: Record<string, string>): string {
  const parts: string[] = []
  if (r.DisplacementL) parts.push(`${r.DisplacementL}L`)
  if (r.EngineCylinders && r.EngineCylinders !== "0") parts.push(`${r.EngineCylinders}-Cylinder`)
  if (r.EngineConfiguration) parts.push(r.EngineConfiguration)
  if (parts.length === 0 && r.FuelTypePrimary?.toLowerCase().includes("electric")) {
    return "Electric Motor"
  }
  return parts.join(" ") || ""
}
