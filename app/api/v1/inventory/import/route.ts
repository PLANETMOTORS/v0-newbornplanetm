import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const REQUIRED_FIELDS = ["stock_number", "vin", "year", "make", "model", "price", "mileage"] as const

const INTEGER_FIELDS = new Set([
  "year", "mileage", "price", "msrp", "fuel_economy_city", "fuel_economy_highway",
  "range_miles", "inspection_score", "ev_battery_health_percent",
])
const BOOLEAN_FIELDS = new Set(["is_ev", "is_certified", "is_new_arrival", "featured", "has_360_spin"])

type ImportError = { row: number; error: string }

function coerceCsvValue(
  header: string,
  value: string,
  rowIndex: number,
  vehicle: Record<string, unknown>,
  errors: ImportError[],
): boolean {
  if (INTEGER_FIELDS.has(header)) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      errors.push({ row: rowIndex + 1, error: `Invalid numeric value for ${header}: "${value}"` })
      return false
    }
    vehicle[header] = parsed
    return true
  }
  if (header === "battery_capacity_kwh") {
    const parsed = Number.parseFloat(value)
    if (Number.isNaN(parsed)) {
      errors.push({ row: rowIndex + 1, error: `Invalid numeric value for ${header}: "${value}"` })
      return false
    }
    vehicle[header] = parsed
    return true
  }
  if (BOOLEAN_FIELDS.has(header)) {
    vehicle[header] = value.toLowerCase() === "true" || value === "1"
    return true
  }
  if (header === "image_urls") {
    vehicle[header] = value.split("|").map(u => u.trim()).filter(Boolean)
    return true
  }
  vehicle[header] = value
  return true
}

function parseVehicleRow(
  rowIndex: number,
  values: string[],
  headers: string[],
  errors: ImportError[],
): Record<string, unknown> | null {
  if (values.length !== headers.length) {
    errors.push({ row: rowIndex + 1, error: "Column count mismatch" })
    return null
  }
  const vehicle: Record<string, unknown> = {}
  for (let j = 0; j < headers.length; j++) {
    const value = values[j]?.trim()
    if (!value) continue
    if (!coerceCsvValue(headers[j], value, rowIndex, vehicle, errors)) return null
  }
  const missing = REQUIRED_FIELDS.filter(f => !vehicle[f])
  if (missing.length > 0) {
    errors.push({ row: rowIndex + 1, error: `Missing values for: ${missing.join(", ")}` })
    return null
  }
  if (typeof vehicle.vin === "string" && vehicle.vin.length !== 17) {
    errors.push({ row: rowIndex + 1, error: `Invalid VIN length: ${vehicle.vin.length} (must be 17)` })
    return null
  }
  return vehicle
}

// CSV Import endpoint for vehicle inventory
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter(line => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have headers and at least one data row" }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    const missingFields = REQUIRED_FIELDS.filter(f => !headers.includes(f))
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
    }

    const vehicles: Record<string, unknown>[] = []
    const errors: ImportError[] = []
    for (let i = 1; i < lines.length; i++) {
      const parsed = parseVehicleRow(i, parseCSVLine(lines[i]), headers, errors)
      if (parsed) vehicles.push(parsed)
    }

    if (vehicles.length === 0) {
      return NextResponse.json({
        error: "No valid vehicles to import",
        errors,
      }, { status: 400 })
    }

    // Upsert vehicles (update existing by VIN, insert new)
    const { error } = await supabase
      .from("vehicles")
      .upsert(vehicles, { 
        onConflict: "vin",
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error("Import error:", error)
      return NextResponse.json({ 
        error: "Database error during import",
        details: error.message 
      }, { status: 500 })
    }

    const skipSuffix = errors.length > 0 ? ` (${errors.length} rows skipped)` : ""
    return NextResponse.json({
      success: true,
      imported: vehicles.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${vehicles.length} vehicles${skipSuffix}`
    })

  } catch (error) {
    console.error("CSV Import error:", error)
    return NextResponse.json({ 
      error: "Failed to process CSV file" 
    }, { status: 500 })
  }
}

// GET endpoint to download CSV template
export function GET() {
  const headers = [
    "stock_number",
    "vin",
    "year",
    "make",
    "model",
    "trim",
    "body_style",
    "exterior_color",
    "interior_color",
    "price",
    "msrp",
    "mileage",
    "drivetrain",
    "transmission",
    "engine",
    "fuel_type",
    "fuel_economy_city",
    "fuel_economy_highway",
    "is_ev",
    "battery_capacity_kwh",
    "range_miles",
    "ev_battery_health_percent",
    "status",
    "is_certified",
    "is_new_arrival",
    "featured",
    "inspection_score",
    "primary_image_url",
    "image_urls",
    "location"
  ]

  const sampleRow = [
    "PM-2024-001",
    "1HGCV1F34PA000001",
    "2024",
    "Honda",
    "Civic",
    "EX-L",
    "Sedan",
    "White",
    "Black Leather",
    "2999900",
    "3499900",
    "15000",
    "FWD",
    "CVT",
    "2.0L 4-Cylinder",
    "Gasoline",
    "30",
    "38",
    "FALSE",
    "",
    "",
    "",
    "available",
    "TRUE",
    "TRUE",
    "FALSE",
    "210",
    "https://example.com/image.jpg",
    "",
    "Richmond Hill ON"
  ]

  const csv = [
    headers.join(","),
    sampleRow.join(",")
  ].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=planet-motors-inventory-template.csv"
    }
  })
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}
