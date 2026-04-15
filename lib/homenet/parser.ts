import { neon } from "@neondatabase/serverless"

// ==================== TYPES ====================

export interface VehicleData {
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
  source_vdp_url?: string
  title_status?: string
}

export type SqlClient = ReturnType<typeof neon>

export function getSql(): SqlClient | null {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL
  if (!url) return null
  return neon(url)
}

// ==================== CSV PARSER ====================

const KNOWN_CSV_COLUMNS = new Set([
  "vin", "stock_number", "stocknumber", "dealerstocknum", "stock",
  "year", "make", "model", "trim", "series",
  "body_style", "bodystyle", "body", "bodytype",
  "exterior_color", "exteriorcolor", "color", "extcolor",
  "interior_color", "interiorcolor", "intcolor",
  "price", "sellingprice", "internetprice",
  "msrp", "retailprice",
  "mileage", "odometer",
  "drivetrain", "drivetype",
  "transmission", "trans",
  "engine", "enginedescription",
  "fuel_type", "fueltype", "fuel",
  "fuel_economy_city", "citympg",
  "fuel_economy_highway", "highwaympg",
  "is_ev", "isev",
  "battery_capacity_kwh", "batterycapacity",
  "range_miles", "range", "evrange",
  "status",
  "is_certified", "certified", "cpo", "condition",
  "is_new_arrival", "newarrival",
  "featured",
  "inspection_score", "inspectionscore",
  "primary_image_url", "mainphoto",
  "image_urls", "photos", "images", "photo",
  "has_360_spin", "has360",
  "video_url", "video",
  "location", "dealerlocation",
  "comments", "description",
  "vdplink", "vdp_link",
  "titlestatus", "title_status",
])

export function parseHomenetCSV(csvText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const lines = csvText.split("\n").filter(line => line.trim())
  if (lines.length < 2) return vehicles

  const rawHeaders = parseCSVLine(lines[0])
  const headers = rawHeaders.map(h =>
    h.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
  )

  const unmappedColumns = headers.filter(h => h && !KNOWN_CSV_COLUMNS.has(h))
  if (unmappedColumns.length > 0) {
    console.warn(`[HomenetIOL] Unmapped CSV columns (${unmappedColumns.length}): ${unmappedColumns.join(", ")}`)
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || "" })
    const vehicle = mapCSVToVehicle(row)
    if (vehicle && vehicle.vin && vehicle.stock_number) {
      vehicles.push(vehicle)
    }
  }
  return vehicles
}

function mapCSVToVehicle(row: Record<string, string>): VehicleData | null {
  const get = (keys: string[]): string => {
    for (const key of keys) { if (row[key]) return row[key] }
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
  const rawImages = get(["image_urls", "photos", "images", "photo"])
  const images = parseImageUrls(rawImages)

  const condition = get(["condition"]).toLowerCase()
  let isCertified = getBool(["is_certified", "certified", "cpo"])
  if (condition === "cpo") {
    isCertified = true
  } else if (condition === "used" || condition === "new") {
    if (!get(["is_certified", "certified", "cpo"])) isCertified = false
  }

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
    is_certified: isCertified,
    is_new_arrival: getBool(["is_new_arrival", "newarrival"]),
    featured: getBool(["featured"]),
    inspection_score: getNum(["inspection_score", "inspectionscore"]) || 210,
    primary_image_url: images[0] || get(["primary_image_url", "mainphoto"]),
    image_urls: images,
    has_360_spin: getBool(["has_360_spin", "has360"]),
    video_url: get(["video_url", "video"]),
    location: get(["location", "dealerlocation"]) || "Richmond Hill, ON",
    description: get(["comments", "description"]) || undefined,
    source_vdp_url: get(["vdplink", "vdp_link"]) || undefined,
    title_status: get(["titlestatus", "title_status"]) || undefined,
  }
}

function parseImageUrls(raw: string): string[] {
  if (!raw) return []
  if (raw.includes("|")) {
    return raw.split("|").map(u => u.trim()).filter(u => u.startsWith("http"))
  }
  return raw.split(",").map(u => u.trim()).filter(u => u.startsWith("http"))
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (char === "," && !inQuotes) {
      result.push(current); current = ""
    } else { current += char }
  }
  result.push(current)
  return result
}

// ==================== DATABASE SYNC ====================

export async function syncVehiclesToDatabase(sql: SqlClient, vehicles: VehicleData[]) {
  let inserted = 0
  let updated = 0
  const errors: { vin: string; error: string }[] = []
  const BATCH_SIZE = 100

  for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
    const batch = vehicles.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (vehicle) => {
        try {
          const result = await sql`
            INSERT INTO vehicles (
              stock_number, vin, year, make, model, trim, body_style,
              exterior_color, interior_color, price, msrp, mileage,
              drivetrain, transmission, engine, fuel_type,
              fuel_economy_city, fuel_economy_highway, is_ev,
              battery_capacity_kwh, range_miles, status, is_certified,
              is_new_arrival, featured, inspection_score,
              primary_image_url, image_urls, has_360_spin, video_url, location,
              description, source_vdp_url, title_status
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
              ${vehicle.location || 'Richmond Hill, ON'},
              ${vehicle.description || null}, ${vehicle.source_vdp_url || null},
              ${vehicle.title_status || null}
            )
            ON CONFLICT (vin)
            DO UPDATE SET
              stock_number = EXCLUDED.stock_number,
              year = EXCLUDED.year, make = EXCLUDED.make,
              model = EXCLUDED.model, trim = EXCLUDED.trim,
              body_style = EXCLUDED.body_style,
              exterior_color = EXCLUDED.exterior_color,
              interior_color = EXCLUDED.interior_color,
              price = EXCLUDED.price, msrp = EXCLUDED.msrp,
              mileage = EXCLUDED.mileage, drivetrain = EXCLUDED.drivetrain,
              transmission = EXCLUDED.transmission, engine = EXCLUDED.engine,
              fuel_type = EXCLUDED.fuel_type,
              fuel_economy_city = EXCLUDED.fuel_economy_city,
              fuel_economy_highway = EXCLUDED.fuel_economy_highway,
              is_ev = EXCLUDED.is_ev,
              battery_capacity_kwh = EXCLUDED.battery_capacity_kwh,
              range_miles = EXCLUDED.range_miles, status = EXCLUDED.status,
              is_certified = EXCLUDED.is_certified,
              is_new_arrival = EXCLUDED.is_new_arrival,
              featured = EXCLUDED.featured,
              inspection_score = EXCLUDED.inspection_score,
              primary_image_url = EXCLUDED.primary_image_url,
              image_urls = EXCLUDED.image_urls,
              has_360_spin = EXCLUDED.has_360_spin,
              video_url = EXCLUDED.video_url,
              location = EXCLUDED.location,
              description = EXCLUDED.description,
              source_vdp_url = EXCLUDED.source_vdp_url,
              title_status = EXCLUDED.title_status,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `
          const rows = result as Record<string, unknown>[]
          if (rows?.[0]?.inserted) { inserted++ } else { updated++ }
        } catch (error) {
          console.error(`[HomenetIOL] Error syncing VIN ${vehicle.vin}:`, error)
          errors.push({
            vin: vehicle.vin,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      })
    )
  }

  return { inserted, updated, errors }
}


// ==================== XML PARSER ====================

export function parseHomenetXML(xmlText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const vehicleMatches = xmlText.match(/<(vehicle|item|listing)[^>]*>[\s\S]*?<\/\1>/gi) || []
  for (const vehicleXml of vehicleMatches) {
    try {
      const vehicle = parseVehicleFromXML(vehicleXml)
      if (vehicle && vehicle.vin && vehicle.stock_number) vehicles.push(vehicle)
    } catch (e) {
      console.error("[HomenetIOL] Error parsing vehicle XML:", e)
    }
  }
  return vehicles
}

function parseVehicleFromXML(xml: string): VehicleData | null {
  const getValue = (tag: string): string => {
    const variations = getTagVariations(tag)
    for (const variant of variations) {
      const match = xml.match(new RegExp(`<${variant}[^>]*>([^<]*)</${variant}>`, "i"))
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
    const imagePatterns = [
      /<photo[^>]*>([^<]+)<\/photo>/gi,
      /<image[^>]*>([^<]+)<\/image>/gi,
      /<imageurl[^>]*>([^<]+)<\/imageurl>/gi,
      /<img[^>]*src="([^"]+)"/gi,
    ]
    for (const pattern of imagePatterns) {
      let match
      while ((match = pattern.exec(xml)) !== null) {
        if (match[1] && match[1].startsWith("http")) images.push(match[1])
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
    price,
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
    location: getValue("location") || getValue("dealerlocation") || "Richmond Hill, ON",
  }
}

function getTagVariations(tag: string): string[] {
  const base = tag.toLowerCase()
  return [
    base,
    base.replace(/_/g, ""),
    base.replace(/_/g, "-"),
    base.charAt(0).toUpperCase() + base.slice(1),
    base.toUpperCase(),
  ]
}