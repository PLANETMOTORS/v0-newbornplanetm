import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const INT_HEADERS = new Set([
  "year", "mileage", "price", "msrp",
  "fuel_economy_city", "fuel_economy_highway",
  "range_miles", "inspection_score", "ev_battery_health_percent",
])
const BOOL_HEADERS = new Set(["is_ev", "is_certified", "is_new_arrival", "featured", "has_360_spin"])

type FieldResult = { ok: true; value: unknown } | { ok: false; error: string }

function parseCSVField(header: string, value: string): FieldResult {
  if (INT_HEADERS.has(header)) {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) return { ok: false, error: `Invalid numeric value for ${header}: "${value}"` }
    return { ok: true, value: parsed }
  }
  if (header === "battery_capacity_kwh") {
    const parsed = parseFloat(value)
    if (isNaN(parsed)) return { ok: false, error: `Invalid numeric value for ${header}: "${value}"` }
    return { ok: true, value: parsed }
  }
  if (BOOL_HEADERS.has(header)) {
    return { ok: true, value: value.toLowerCase() === "true" || value === "1" }
  }
  if (header === "image_urls") {
    return { ok: true, value: value.split("|").map(url => url.trim()).filter(Boolean) }
  }
  return { ok: true, value }
}

type RowResult =
  | { ok: true; vehicle: Record<string, unknown> }
  | { ok: false; error: { row: number; error: string } }

function parseCSVRow(
  headers: string[],
  values: string[],
  rowNum: number,
  requiredFields: string[]
): RowResult {
  if (values.length !== headers.length) {
    return { ok: false, error: { row: rowNum, error: "Column count mismatch" } }
  }
  const vehicle: Record<string, unknown> = {}
  for (let j = 0; j < headers.length; j++) {
    const value = values[j]?.trim()
    if (!value) continue
    const result = parseCSVField(headers[j], value)
    if (!result.ok) return { ok: false, error: { row: rowNum, error: result.error } }
    vehicle[headers[j]] = result.value
  }
  const missing = requiredFields.filter(f => !vehicle[f])
  if (missing.length > 0) {
    return { ok: false, error: { row: rowNum, error: `Missing values for: ${missing.join(", ")}` } }
  }
  if (vehicle.vin && String(vehicle.vin).length !== 17) {
    return { ok: false, error: { row: rowNum, error: `Invalid VIN length: ${String(vehicle.vin).length} (must be 17)` } }
  }
  return { ok: true, vehicle }
}

// CSV Import endpoint for vehicle inventory
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const text = await file.text()
    const lines = text.split("\n").filter(line => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have headers and at least one data row" }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    const requiredFields = ["stock_number", "vin", "year", "make", "model", "price", "mileage"]
    const missingHeaders = requiredFields.filter(f => !headers.includes(f))
    if (missingHeaders.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingHeaders.join(", ")}` }, { status: 400 })
    }

    const vehicles: Record<string, unknown>[] = []
    const errors: { row: number; error: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const result = parseCSVRow(headers, parseCSVLine(lines[i]), i + 1, requiredFields)
      if (result.ok) vehicles.push(result.vehicle)
      else errors.push(result.error)
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ error: "No valid vehicles to import", errors }, { status: 400 })
    }

    const { error } = await supabase
      .from("vehicles")
      .upsert(vehicles, { onConflict: "vin", ignoreDuplicates: false })
      .select()

    if (error) {
      console.error("Import error:", error)
      return NextResponse.json({ error: "Database error during import", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: vehicles.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${vehicles.length} vehicles${errors.length > 0 ? ` (${errors.length} rows skipped)` : ""}`,
    })
  } catch (error) {
    console.error("CSV Import error:", error)
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 })
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
