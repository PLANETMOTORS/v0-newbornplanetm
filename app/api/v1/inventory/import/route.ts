import { createHash } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cacheIdempotentResponse, getCachedIdempotentResponse, rateLimit } from "@/lib/redis"
import { recordAdminAuditEvent, requireAdminUser } from "@/lib/auth/admin"

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_ROWS = 500
const MIN_SUPPORTED_YEAR = 1990
const MAX_SUPPORTED_YEAR = new Date().getUTCFullYear() + 1

// CSV Import endpoint for vehicle inventory
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const adminCheck = await requireAdminUser(supabase)
    if (!adminCheck.ok) {
      return adminCheck.response
    }

    const forwarded = request.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`inventory-import:${adminCheck.user.id}:${ip}`, 2, 3600)
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many inventory import requests. Please try again later." }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return NextResponse.json({ error: "CSV file exceeds 5MB upload limit" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter(line => line.trim())

    if (lines.length - 1 > MAX_IMPORT_ROWS) {
      return NextResponse.json({ error: `CSV exceeds maximum supported size of ${MAX_IMPORT_ROWS} vehicles` }, { status: 400 })
    }

    const idempotencyDigest = createHash("sha256").update(text).digest("hex")
    const replayCacheKey = `inventory-import:${adminCheck.user.id}:${idempotencyDigest}`
    const cached = await getCachedIdempotentResponse<Record<string, unknown>>(replayCacheKey)
    if (cached) {
      return NextResponse.json(
        {
          ...cached,
          idempotency: { digest: idempotencyDigest, replay: true },
        },
        { headers: { "x-idempotent-replay": "true" } }
      )
    }
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have headers and at least one data row" }, { status: 400 })
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    
    // Required fields validation
    const requiredFields = ["stock_number", "vin", "year", "make", "model", "price", "mileage"]
    const missingFields = requiredFields.filter(f => !headers.includes(f))
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(", ")}` 
      }, { status: 400 })
    }

    // Parse data rows
    const vehicles = []
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) {
        errors.push({ row: i + 1, error: "Column count mismatch" })
        continue
      }

      const vehicle: Record<string, unknown> = {}
      let invalidRow = false

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]
        const value = values[j]?.trim()
        if (!value) continue

        // Type conversions
        switch (header) {
          case "year":
          case "mileage":
          case "price":
          case "msrp":
          case "fuel_economy_city":
          case "fuel_economy_highway":
          case "range_miles":
          case "inspection_score":
          case "ev_battery_health_percent": {
            const parsed = parseInt(value, 10)
            if (isNaN(parsed)) {
              errors.push({ row: i + 1, error: `Invalid numeric value for ${header}: "${value}"` })
              invalidRow = true
            } else {
              vehicle[header] = parsed
            }
            break
          }
          case "battery_capacity_kwh": {
            const parsed = parseFloat(value)
            if (isNaN(parsed)) {
              errors.push({ row: i + 1, error: `Invalid numeric value for ${header}: "${value}"` })
              invalidRow = true
            } else {
              vehicle[header] = parsed
            }
            break
          }
          case "is_ev":
          case "is_certified":
          case "is_new_arrival":
          case "featured":
          case "has_360_spin":
            vehicle[header] = value.toLowerCase() === "true" || value === "1"
            break
          case "image_urls":
            vehicle[header] = value.split("|").map(url => url.trim()).filter(Boolean)
            break
          default:
            vehicle[header] = value
        }
      }

      if (invalidRow) continue

      // Validate required fields have values
      const vehicleMissingFields = requiredFields.filter(f => !vehicle[f])
      if (vehicleMissingFields.length > 0) {
        errors.push({ row: i + 1, error: `Missing values for: ${vehicleMissingFields.join(", ")}` })
        continue
      }

      // Validate VIN length and core monetary bounds
      if (vehicle.vin && String(vehicle.vin).length !== 17) {
        errors.push({ row: i + 1, error: `Invalid VIN length: ${String(vehicle.vin).length} (must be 17)` })
        continue
      }

      const year = Number(vehicle.year)
      const price = Number(vehicle.price)
      const mileage = Number(vehicle.mileage)

      if (!Number.isFinite(year) || year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
        errors.push({ row: i + 1, error: `Invalid year: ${vehicle.year}` })
        continue
      }

      if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
        errors.push({ row: i + 1, error: `Invalid price cents value: ${vehicle.price}` })
        continue
      }

      if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2000000) {
        errors.push({ row: i + 1, error: `Invalid mileage value: ${vehicle.mileage}` })
        continue
      }

      vehicles.push(vehicle)
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ 
        error: "No valid vehicles to import",
        errors 
      }, { status: 400 })
    }

    // Upsert vehicles (update existing by VIN, insert new)
    const { data, error } = await supabase
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

    const payload = {
      success: true,
      imported: vehicles.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${vehicles.length} vehicles${errors.length > 0 ? ` (${errors.length} rows skipped)` : ""}`,
    }

    await cacheIdempotentResponse(replayCacheKey, payload, 3600)

    ;(async () => {
      await recordAdminAuditEvent({
        actorId: adminCheck.user.id,
        action: "inventory_import_csv",
        entityType: "vehicle_inventory",
        entityId: idempotencyDigest,
        afterState: `imported:${vehicles.length}`,
        notes: `rows=${lines.length - 1};errors=${errors.length};ip=${ip}`,
      })
    })()

    return NextResponse.json(payload)

  } catch (error) {
    console.error("CSV Import error:", error)
    return NextResponse.json({ 
      error: "Failed to process CSV file" 
    }, { status: 500 })
  }
}

// GET endpoint to download CSV template
export async function GET() {
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
