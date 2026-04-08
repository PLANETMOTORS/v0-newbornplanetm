import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return neon(url)
}

// API Key for HomenetIOL webhook authentication
const HOMENET_API_KEY = process.env.HOMENET_API_KEY || "pm_homenet_2024_secure"

/**
 * HomenetIOL Inventory Feed Webhook
 * 
 * This endpoint receives inventory data from HomenetIOL in XML or CSV format
 * and syncs it to the Neon Postgres database.
 * 
 * Flow: HomenetIOL -> This Webhook -> Parse XML/CSV -> Upsert to Neon -> Response
 */

export async function POST(request: Request) {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }
  try {
    // Authenticate the request
    const authHeader = request.headers.get("authorization")
    const apiKeyHeader = request.headers.get("x-api-key")
    const apiKey = apiKeyHeader || authHeader?.replace("Bearer ", "")
    
    if (apiKey !== HOMENET_API_KEY) {
      console.log("[HomenetIOL] Unauthorized request attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    let vehicles: VehicleData[] = []

    // Handle different content types
    if (contentType.includes("multipart/form-data")) {
      // File upload (XML or CSV)
      const formData = await request.formData()
      const file = formData.get("file") as File
      
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const text = await file.text()
      const filename = file.name.toLowerCase()

      if (filename.endsWith(".xml")) {
        vehicles = parseHomenetXML(text)
      } else if (filename.endsWith(".csv")) {
        vehicles = parseHomenetCSV(text)
      } else {
        return NextResponse.json({ error: "Unsupported file format. Use XML or CSV." }, { status: 400 })
      }
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
      // Direct XML body
      const text = await request.text()
      vehicles = parseHomenetXML(text)
    } else if (contentType.includes("application/json")) {
      // JSON payload (alternative)
      const json = await request.json()
      vehicles = Array.isArray(json) ? json : json.vehicles || []
    } else {
      // Try to parse as text (CSV or XML)
      const text = await request.text()
      if (text.trim().startsWith("<?xml") || text.trim().startsWith("<")) {
        vehicles = parseHomenetXML(text)
      } else {
        vehicles = parseHomenetCSV(text)
      }
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ 
        error: "No valid vehicles found in the feed",
        received_content_type: contentType
      }, { status: 400 })
    }

    console.log(`[HomenetIOL] Processing ${vehicles.length} vehicles`)

    // Sync to database
    const result = await syncVehiclesToDatabase(sql, vehicles)

    console.log(`[HomenetIOL] Sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`)

    return NextResponse.json({
      success: true,
      message: `Processed ${vehicles.length} vehicles`,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("[HomenetIOL] Error processing feed:", error)
    return NextResponse.json({ 
      error: "Failed to process inventory feed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint - returns feed status and instructions
export async function GET() {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }
  const vehicleCount = await sql`SELECT COUNT(*) as count FROM vehicles`
  const lastUpdated = await sql`SELECT MAX(updated_at) as last_updated FROM vehicles`
  
  return NextResponse.json({
    status: "active",
    endpoint: "/api/v1/inventory/homenet",
    method: "POST",
    supported_formats: ["XML", "CSV", "JSON"],
    authentication: "API Key via 'x-api-key' header or 'Authorization: Bearer <key>'",
    current_inventory_count: vehicleCount[0]?.count || 0,
    last_updated: lastUpdated[0]?.last_updated || null,
    instructions: {
      xml: "POST XML file with Content-Type: application/xml",
      csv: "POST CSV file as multipart/form-data with field name 'file'",
      json: "POST JSON array with Content-Type: application/json"
    }
  })
}

// ==================== TYPES ====================

interface VehicleData {
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  body_style?: string
  exterior_color?: string
  interior_color?: string
  price: number
  msrp?: number
  mileage: number
  drivetrain?: string
  transmission?: string
  engine?: string
  fuel_type?: string
  fuel_economy_city?: number
  fuel_economy_highway?: number
  is_ev?: boolean
  battery_capacity_kwh?: number
  range_miles?: number
  ev_battery_health_percent?: number
  status?: string
  is_certified?: boolean
  is_new_arrival?: boolean
  featured?: boolean
  inspection_score?: number
  primary_image_url?: string
  image_urls?: string[]
  has_360_spin?: boolean
  video_url?: string
  location?: string
  description?: string
}

// ==================== XML PARSER ====================

function parseHomenetXML(xmlText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  
  // Simple XML parsing for HomenetIOL format
  // HomenetIOL typically uses <vehicle> or <item> tags
  const vehicleMatches = xmlText.match(/<(vehicle|item|listing)[^>]*>[\s\S]*?<\/\1>/gi) || []
  
  for (const vehicleXml of vehicleMatches) {
    try {
      const vehicle = parseVehicleFromXML(vehicleXml)
      if (vehicle && vehicle.vin && vehicle.stock_number) {
        vehicles.push(vehicle)
      }
    } catch (e) {
      console.error("[HomenetIOL] Error parsing vehicle XML:", e)
    }
  }
  
  return vehicles
}

function parseVehicleFromXML(xml: string): VehicleData | null {
  const getValue = (tag: string): string => {
    // Try multiple tag name variations (HomenetIOL field mapping)
    const variations = getTagVariations(tag)
    for (const variant of variations) {
      const match = xml.match(new RegExp(`<${variant}[^>]*>([^<]*)<\/${variant}>`, "i"))
      if (match && match[1]) return match[1].trim()
    }
    return ""
  }

  const getNumber = (tag: string): number | undefined => {
    const val = getValue(tag)
    const num = parseInt(val.replace(/[^0-9.-]/g, ""), 10)
    return isNaN(num) ? undefined : num
  }

  const getBoolean = (tag: string): boolean => {
    const val = getValue(tag).toLowerCase()
    return val === "true" || val === "1" || val === "yes"
  }

  const getImages = (): string[] => {
    const images: string[] = []
    // Try different image tag patterns
    const imagePatterns = [
      /<photo[^>]*>([^<]+)<\/photo>/gi,
      /<image[^>]*>([^<]+)<\/image>/gi,
      /<imageurl[^>]*>([^<]+)<\/imageurl>/gi,
      /<img[^>]*src="([^"]+)"/gi
    ]
    
    for (const pattern of imagePatterns) {
      let match
      while ((match = pattern.exec(xml)) !== null) {
        if (match[1] && match[1].startsWith("http")) {
          images.push(match[1])
        }
      }
    }
    return images
  }

  const vin = getValue("vin")
  const stockNumber = getValue("stocknumber") || getValue("stock_number") || getValue("dealerstocknum")
  
  if (!vin || vin.length !== 17) return null
  if (!stockNumber) return null

  const images = getImages()
  const price = getNumber("price") || getNumber("sellingprice") || getNumber("internetprice") || 0
  const fuelType = getValue("fueltype") || getValue("fuel_type") || getValue("fuel")

  return {
    stock_number: stockNumber,
    vin: vin.toUpperCase(),
    year: getNumber("year") || new Date().getFullYear(),
    make: getValue("make"),
    model: getValue("model"),
    trim: getValue("trim") || getValue("series"),
    body_style: getValue("bodystyle") || getValue("body") || getValue("bodytype"),
    exterior_color: getValue("exteriorcolor") || getValue("color") || getValue("extcolor"),
    interior_color: getValue("interiorcolor") || getValue("intcolor"),
    price: price,
    msrp: getNumber("msrp") || getNumber("retailprice"),
    mileage: getNumber("mileage") || getNumber("odometer") || 0,
    drivetrain: getValue("drivetrain") || getValue("drivetype"),
    transmission: getValue("transmission") || getValue("trans"),
    engine: getValue("engine") || getValue("enginedescription"),
    fuel_type: fuelType,
    fuel_economy_city: getNumber("citympg") || getNumber("fueleconomycity"),
    fuel_economy_highway: getNumber("highwaympg") || getNumber("fueleconomyhighway"),
    is_ev: fuelType?.toLowerCase().includes("electric") || getBoolean("isev"),
    battery_capacity_kwh: getNumber("batterycapacity"),
    range_miles: getNumber("range") || getNumber("evrange"),
    status: getValue("status") || "available",
    is_certified: getBoolean("certified") || getBoolean("cpo"),
    is_new_arrival: getBoolean("newarrival"),
    featured: getBoolean("featured"),
    inspection_score: getNumber("inspectionscore") || 210,
    primary_image_url: images[0] || getValue("mainphoto") || getValue("primaryimage"),
    image_urls: images,
    has_360_spin: getBoolean("has360") || getBoolean("spinview"),
    video_url: getValue("videourl") || getValue("video"),
    location: getValue("location") || getValue("dealerlocation") || "Richmond Hill, ON"
  }
}

function getTagVariations(tag: string): string[] {
  // Return multiple variations of tag names for flexibility
  const base = tag.toLowerCase()
  return [
    base,
    base.replace(/_/g, ""),
    base.replace(/_/g, "-"),
    base.charAt(0).toUpperCase() + base.slice(1),
    base.toUpperCase()
  ]
}

// ==================== CSV PARSER ====================

function parseHomenetCSV(csvText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const lines = csvText.split("\n").filter(line => line.trim())
  
  if (lines.length < 2) return vehicles

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || "" })

    // Map HomenetIOL CSV fields to our schema
    const vehicle = mapCSVToVehicle(row)
    if (vehicle && vehicle.vin && vehicle.stock_number) {
      vehicles.push(vehicle)
    }
  }
  
  return vehicles
}

function mapCSVToVehicle(row: Record<string, string>): VehicleData | null {
  const get = (keys: string[]): string => {
    for (const key of keys) {
      if (row[key]) return row[key]
    }
    return ""
  }

  const getNum = (keys: string[]): number | undefined => {
    const val = get(keys)
    const num = parseInt(val.replace(/[^0-9.-]/g, ""), 10)
    return isNaN(num) ? undefined : num
  }

  const getBool = (keys: string[]): boolean => {
    const val = get(keys).toLowerCase()
    return val === "true" || val === "1" || val === "yes"
  }

  const vin = get(["vin"])
  const stockNumber = get(["stock_number", "stocknumber", "dealerstocknum", "stock"])
  
  if (!vin || vin.length !== 17) return null
  if (!stockNumber) return null

  const fuelType = get(["fuel_type", "fueltype", "fuel"])
  const images = get(["image_urls", "photos", "images"]).split("|").filter(Boolean)

  return {
    stock_number: stockNumber,
    vin: vin.toUpperCase(),
    year: getNum(["year"]) || new Date().getFullYear(),
    make: get(["make"]),
    model: get(["model"]),
    trim: get(["trim", "series"]),
    body_style: get(["body_style", "bodystyle", "body", "bodytype"]),
    exterior_color: get(["exterior_color", "exteriorcolor", "color", "extcolor"]),
    interior_color: get(["interior_color", "interiorcolor", "intcolor"]),
    price: getNum(["price", "sellingprice", "internetprice"]) || 0,
    msrp: getNum(["msrp", "retailprice"]),
    mileage: getNum(["mileage", "odometer"]) || 0,
    drivetrain: get(["drivetrain", "drivetype"]),
    transmission: get(["transmission", "trans"]),
    engine: get(["engine", "enginedescription"]),
    fuel_type: fuelType,
    fuel_economy_city: getNum(["fuel_economy_city", "citympg"]),
    fuel_economy_highway: getNum(["fuel_economy_highway", "highwaympg"]),
    is_ev: fuelType?.toLowerCase().includes("electric") || getBool(["is_ev", "isev"]),
    battery_capacity_kwh: getNum(["battery_capacity_kwh", "batterycapacity"]),
    range_miles: getNum(["range_miles", "range", "evrange"]),
    status: get(["status"]) || "available",
    is_certified: getBool(["is_certified", "certified", "cpo"]),
    is_new_arrival: getBool(["is_new_arrival", "newarrival"]),
    featured: getBool(["featured"]),
    inspection_score: getNum(["inspection_score", "inspectionscore"]) || 210,
    primary_image_url: images[0] || get(["primary_image_url", "mainphoto"]),
    image_urls: images,
    has_360_spin: getBool(["has_360_spin", "has360"]),
    video_url: get(["video_url", "video"]),
    location: get(["location", "dealerlocation"]) || "Richmond Hill, ON"
  }
}

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

// ==================== DATABASE SYNC ====================

async function syncVehiclesToDatabase(sql: ReturnType<typeof neon>, vehicles: VehicleData[]) {
  let inserted = 0
  let updated = 0
  const errors: { vin: string; error: string }[] = []

  for (const vehicle of vehicles) {
    try {
      // Check if vehicle exists
      const existing = await sql`
        SELECT id FROM vehicles WHERE vin = ${vehicle.vin}
      `

      if (existing.length > 0) {
        // Update existing vehicle
        await sql`
          UPDATE vehicles SET
            stock_number = ${vehicle.stock_number},
            year = ${vehicle.year},
            make = ${vehicle.make},
            model = ${vehicle.model},
            trim = ${vehicle.trim || null},
            body_style = ${vehicle.body_style || null},
            exterior_color = ${vehicle.exterior_color || null},
            interior_color = ${vehicle.interior_color || null},
            price = ${vehicle.price},
            msrp = ${vehicle.msrp || null},
            mileage = ${vehicle.mileage},
            drivetrain = ${vehicle.drivetrain || null},
            transmission = ${vehicle.transmission || null},
            engine = ${vehicle.engine || null},
            fuel_type = ${vehicle.fuel_type || null},
            fuel_economy_city = ${vehicle.fuel_economy_city || null},
            fuel_economy_highway = ${vehicle.fuel_economy_highway || null},
            is_ev = ${vehicle.is_ev || false},
            battery_capacity_kwh = ${vehicle.battery_capacity_kwh || null},
            range_miles = ${vehicle.range_miles || null},
            status = ${vehicle.status || 'available'},
            is_certified = ${vehicle.is_certified || true},
            is_new_arrival = ${vehicle.is_new_arrival || false},
            featured = ${vehicle.featured || false},
            inspection_score = ${vehicle.inspection_score || 210},
            primary_image_url = ${vehicle.primary_image_url || null},
            image_urls = ${vehicle.image_urls || []},
            has_360_spin = ${vehicle.has_360_spin || false},
            video_url = ${vehicle.video_url || null},
            location = ${vehicle.location || 'Richmond Hill, ON'},
            updated_at = NOW()
          WHERE vin = ${vehicle.vin}
        `
        updated++
      } else {
        // Insert new vehicle
        await sql`
          INSERT INTO vehicles (
            stock_number, vin, year, make, model, trim, body_style,
            exterior_color, interior_color, price, msrp, mileage,
            drivetrain, transmission, engine, fuel_type,
            fuel_economy_city, fuel_economy_highway, is_ev,
            battery_capacity_kwh, range_miles, status, is_certified,
            is_new_arrival, featured, inspection_score,
            primary_image_url, image_urls, has_360_spin, video_url, location
          ) VALUES (
            ${vehicle.stock_number}, ${vehicle.vin}, ${vehicle.year},
            ${vehicle.make}, ${vehicle.model}, ${vehicle.trim || null},
            ${vehicle.body_style || null}, ${vehicle.exterior_color || null},
            ${vehicle.interior_color || null}, ${vehicle.price},
            ${vehicle.msrp || null}, ${vehicle.mileage},
            ${vehicle.drivetrain || null}, ${vehicle.transmission || null},
            ${vehicle.engine || null}, ${vehicle.fuel_type || null},
            ${vehicle.fuel_economy_city || null}, ${vehicle.fuel_economy_highway || null},
            ${vehicle.is_ev || false}, ${vehicle.battery_capacity_kwh || null},
            ${vehicle.range_miles || null}, ${vehicle.status || 'available'},
            ${vehicle.is_certified || true}, ${vehicle.is_new_arrival || false},
            ${vehicle.featured || false}, ${vehicle.inspection_score || 210},
            ${vehicle.primary_image_url || null}, ${vehicle.image_urls || []},
            ${vehicle.has_360_spin || false}, ${vehicle.video_url || null},
            ${vehicle.location || 'Richmond Hill, ON'}
          )
        `
        inserted++
      }
    } catch (error) {
      console.error(`[HomenetIOL] Error syncing VIN ${vehicle.vin}:`, error)
      errors.push({ 
        vin: vehicle.vin, 
        error: error instanceof Error ? error.message : "Unknown error" 
      })
    }
  }

  return { inserted, updated, errors }
}
