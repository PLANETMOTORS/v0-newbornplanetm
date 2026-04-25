import { neon } from "@neondatabase/serverless"

// ==================== TYPES ====================

export interface VehicleData {
  // === A2 Identity Fields ===
  stock_number: string
  vin: string
  slug: string                    // A2: human-readable canonical URL slug
  title: string                   // A2: derived display title, e.g. "2023 Ford F-150 XLT"
  dealer_id: string               // A2: multi-store safe partition key
  source_system: string           // A2: defaults to "homenet"

  // === A2 Core Vehicle Fields ===
  year: number
  make: string
  model: string
  trim?: string
  body_style?: string
  condition: string               // A2: "new" | "used" | "certified_used"
  exterior_color?: string
  interior_color?: string
  doors?: number                  // A2: optional numeric filter value
  drivetrain?: string
  transmission?: string
  engine?: string
  fuel_type?: string

  // === A2 Pricing (integer CAD dollars) ===
  price_cad?: number              // A2: primary live price, nullable
  sale_price_cad?: number         // A2: optional promotional price
  msrp_cad?: number               // A2: useful for new inventory

  // === A2 Mileage ===
  mileage_km: number              // A2: null for some new/in-transit units

  // === A2 Status & Merchandising ===
  status: string                  // A2: available/pending/reserved/sold/in_transit/wholesale/draft
  availability_bucket: string     // A2: live/sold/hidden
  is_certified: boolean           // A2: defaults false
  is_featured: boolean            // A2: defaults false
  is_new_arrival?: boolean

  // === EV Fields ===
  is_ev?: boolean
  fuel_economy_city?: number
  fuel_economy_highway?: number
  battery_capacity_kwh?: number
  range_miles?: number

  // === A2 Media ===
  primary_image_url?: string
  image_urls?: string[]           // A2: ingestion inputs only, not for frontend rendering
  has_360_spin?: boolean
  video_url?: string

  // === A2 Content ===
  description?: string            // A2: canonical long description for VDP
  feature_bullets?: string[]      // A2: array of short strings for VDP
  options?: string[]              // A2: array of option strings
  location?: string

  // === Legacy / Compat ===
  inspection_score?: number
  source_vdp_url?: string
  title_status?: string

  // === Backward compat aliases (will be removed after DB migration) ===
  price: number                   // Legacy: price in cents
  msrp?: number                   // Legacy: msrp in cents
  mileage: number                 // Legacy: alias for mileage_km
  featured?: boolean              // Legacy: alias for is_featured
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
  "price", "sellingprice", "internetprice", "internet_price",
  "msrp", "retailprice", "originalmsrp",
  "mileage", "odometer", "miles",
  "drivetrain", "drivetype",
  "transmission", "trans",
  "engine", "enginedescription", "enginecylinders", "enginedisplacement",
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
  "image_urls", "photos", "images", "photo", "imagelist",
  "has_360_spin", "has360",
  "video_url", "video",
  "location", "dealerlocation",
  "comments", "description",
  "vdplink", "vdp_link",
  "titlestatus", "title_status",
  // HomeNet metadata columns (not directly mapped to DB but recognized)
  "dealername", "type", "modelnumber", "doors", "bookvalue", "invoice",
  "misc_price1", "misc_price2", "misc_price3", "flooring",
  "dateinstock", "options",
  "comment1", "comment2", "comment3", "comment4",
])

export function parseHomenetCSV(csvText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const lines = csvText.split("\n").filter(line => line.trim())
  if (lines.length < 2) return vehicles

  const rawHeaders = parseCSVLine(lines[0])
  const headers = rawHeaders.map(h =>
    h.trim().toLowerCase().replaceAll(/[^a-z0-9]/g, "_").replaceAll(/_+/g, "_").replaceAll(/^_|_$/g, "")
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
    if (vehicle?.vin && vehicle.stock_number) {
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
    const num = Number.parseInt(val.replaceAll(/[^0-9.-]/g, ""), 10)
    return Number.isNaN(num) ? undefined : num
  }
  const getBool = (keys: string[]): boolean => {
    const val = get(keys).toLowerCase()
    return val === "true" || val === "1" || val === "yes"
  }

  const vin = get(["vin"])
  const stockNumber = get(["stock_number", "stocknumber", "dealerstocknum", "stock"])
  if (vin?.length !== 17) return null
  if (!stockNumber) return null

  // Normalize HomeNet fuel values: "Gasoline Fuel" → "Gasoline", "Electric Fuel System" → "Electric"
  let fuelType = get(["fuel_type", "fueltype", "fuel"])
  if (fuelType) {
    // String-based normalization (no regex) to avoid Sonar S5852 (regex
    // backtracking risk on untrusted CSV input). Strip a trailing
    // "fuel system" or "fuel" suffix, case-insensitive.
    const trimmed = fuelType.trimEnd()
    const lower = trimmed.toLowerCase()
    let stripped = trimmed
    for (const suffix of ["fuel system", "fuel"]) {
      if (lower.endsWith(suffix)) {
        stripped = trimmed.slice(0, trimmed.length - suffix.length).trimEnd()
        break
      }
    }
    fuelType = stripped || fuelType
  }
  const rawImages = get(["image_urls", "photos", "images", "photo", "imagelist"])
  const images = parseImageUrls(rawImages)

  // Compose engine string from cylinders + displacement if "engine" column is absent
  let engineStr = get(["engine", "enginedescription"])
  if (!engineStr) {
    const cyl = get(["enginecylinders"])
    const disp = get(["enginedisplacement"])
    // Skip "0.0", "0.0 L", etc. displacement for EVs
    const validDisp = disp && !/^0+(\.0+)?(\s|$)/.test(disp) ? disp : ""
    if (validDisp) engineStr = validDisp + (cyl ? ` ${cyl}-Cylinder` : "")
    else if (cyl && cyl !== "0") engineStr = `${cyl}-Cylinder`
    // EVs: leave engine empty — it's electric
  }

  // === A2: Condition mapping ===
  // HomeNet "Type" column: "Used", "New", "CPO" → A2 condition values
  const rawCondition = get(["condition", "type"]).toLowerCase()
  let isCertified = getBool(["is_certified", "certified", "cpo"])
  let a2Condition = "used"
  if (rawCondition === "cpo" || rawCondition === "certified" || rawCondition === "certified_used") {
    a2Condition = "certified_used"
    isCertified = true
  } else if (rawCondition === "new") {
    a2Condition = "new"
  } else if (!get(["is_certified", "certified", "cpo"])) {
    isCertified = false
  }

  // === A2: Core vehicle fields ===
  const year = getNum(["year"]) || new Date().getFullYear()
  const make = get(["make"])
  const model = get(["model"])
  const trim = get(["trim", "series"])
  const normalizedVin = vin.toUpperCase()

  // === A2: Derived fields ===
  const trimSuffix = trim ? ` ${trim}` : ""
  const trimSlugSuffix = trim ? `-${trim}` : ""
  const title = `${year} ${make} ${model}${trimSuffix}`
  const slug = `${year}-${make}-${model}${trimSlugSuffix}-${stockNumber}`
    .toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")
  const priceDollars = getNum(["price", "sellingprice", "internetprice", "internet_price"])
  const msrpDollars = getNum(["msrp", "retailprice", "originalmsrp"])

  // === A2: Mileage ===
  const mileageKm = getNum(["mileage", "odometer", "miles"]) || 0

  // === A2: Status mapping ===
  const rawStatus = get(["status"]).toLowerCase()
  const a2Status = rawStatus || "available"
  // Derive availability_bucket from status per A2 Section 4
  let availabilityBucket = "live"
  if (a2Status === "sold") availabilityBucket = "sold"
  else if (a2Status === "wholesale" || a2Status === "draft") availabilityBucket = "hidden"

  // === A2: Options / features ===
  const rawOptions = get(["options"])
  const optionsList = rawOptions ? rawOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined

  // === A2: Doors ===
  const doors = getNum(["doors"])

  // === A2: Description from comments ===
  const description = get(["comments", "description", "comment1"]) || undefined

  const isEv = fuelType?.toLowerCase().includes("electric") || getBool(["is_ev", "isev"])
  const isFeatured = getBool(["featured", "is_featured"])

  return {
    // A2 Identity
    stock_number: stockNumber,
    vin: normalizedVin,
    slug,
    title,
    dealer_id: get(["dealerid", "dealer_id"]) || "planet-motors",
    source_system: "homenet",

    // A2 Core
    year,
    make,
    model,
    trim,
    body_style: get(["body_style", "bodystyle", "body", "bodytype"]),
    condition: a2Condition,
    exterior_color: get(["exterior_color", "exteriorcolor", "color", "extcolor"]),
    interior_color: get(["interior_color", "interiorcolor", "intcolor"]),
    doors,
    drivetrain: get(["drivetrain", "drivetype"]),
    transmission: get(["transmission", "trans"]),
    engine: engineStr,
    fuel_type: fuelType,

    // A2 Pricing (integer CAD dollars)
    price_cad: priceDollars || undefined,
    sale_price_cad: undefined, // HomeNet doesn't send sale price separately
    msrp_cad: msrpDollars || undefined,

    // A2 Mileage
    mileage_km: mileageKm,

    // A2 Status & Merchandising
    status: a2Status,
    availability_bucket: availabilityBucket,
    is_certified: isCertified,
    is_featured: isFeatured,
    is_new_arrival: getBool(["is_new_arrival", "newarrival"]),

    // EV
    is_ev: isEv,
    fuel_economy_city: getNum(["fuel_economy_city", "citympg"]),
    fuel_economy_highway: getNum(["fuel_economy_highway", "highwaympg"]),
    battery_capacity_kwh: getNum(["battery_capacity_kwh", "batterycapacity"]),
    range_miles: getNum(["range_miles", "range", "evrange"]),

    // A2 Media
    primary_image_url: images[0] || get(["primary_image_url", "mainphoto"]),
    image_urls: images,
    has_360_spin: getBool(["has_360_spin", "has360"]),
    video_url: get(["video_url", "video"]),

    // A2 Content
    description,
    feature_bullets: undefined, // HomeNet doesn't provide structured bullets
    options: optionsList,
    location: get(["location", "dealerlocation"]) || "Richmond Hill, ON",

    // Legacy
    inspection_score: getNum(["inspection_score", "inspectionscore"]) || 210,
    source_vdp_url: get(["vdplink", "vdp_link"]) || undefined,
    title_status: get(["titlestatus", "title_status"]) || undefined,

    // Backward compat aliases (for existing DB sync until migration)
    price: (priceDollars || 0) * 100,
    msrp: msrpDollars == null ? undefined : msrpDollars * 100,
    mileage: mileageKm,
    featured: isFeatured,
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

/**
 * Full-replacement sync: the incoming file IS the complete inventory.
 * 1. Upsert all vehicles from the file
 * 2. Delete every vehicle NOT in the file
 * Result: website shows ONLY what HomeNet sent. Nothing else.
 */
export async function syncVehiclesToDatabase(sql: SqlClient, vehicles: VehicleData[]) {
  let inserted = 0
  let updated = 0
  let removed = 0
  const errors: { vin: string; error: string }[] = []
  const BATCH_SIZE = 100

  // Collect all VINs from incoming file
  const incomingVins = vehicles.map(v => v.vin)

  // Step 1: Upsert all vehicles from the file
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
              ${vehicle.is_ev ?? false}, ${vehicle.battery_capacity_kwh || null},
              ${vehicle.range_miles || null}, ${vehicle.status || 'available'},
              ${vehicle.is_certified ?? true}, ${vehicle.is_new_arrival ?? false},
              ${vehicle.featured ?? false}, ${vehicle.inspection_score ?? 210},
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

  // Step 2: Delete all vehicles NOT in the incoming file
  // The new file IS the inventory. Anything not in it is gone.
  try {
    const deleteResult = await sql`
      DELETE FROM vehicles
      WHERE vin != ALL(${incomingVins})
      RETURNING vin
    `
    removed = (deleteResult as unknown[]).length
    if (removed > 0) {
      console.info(`[HomenetIOL] Removed ${removed} vehicles not in incoming file`)
    }
  } catch (error) {
    console.error(`[HomenetIOL] Error removing old vehicles:`, error)
    errors.push({
      vin: "BULK_DELETE",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  return { inserted, updated, removed, errors }
}


// ==================== XML PARSER ====================

export function parseHomenetXML(xmlText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const vehicleMatches = xmlText.match(/<(vehicle|item|listing)[^>]*>[\s\S]*?<\/\1>/gi) || []
  for (const vehicleXml of vehicleMatches) {
    try {
      const vehicle = parseVehicleFromXML(vehicleXml)
      if (vehicle?.vin && vehicle.stock_number) vehicles.push(vehicle)
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
      if (match?.[1]) return match[1].trim()
    }
    return ""
  }
  const getNumber = (tag: string): number | undefined => {
    const val = getValue(tag)
    const num = Number.parseInt(val.replaceAll(/[^0-9.-]/g, ""), 10)
    return Number.isNaN(num) ? undefined : num
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
        if (match[1]?.startsWith("http")) images.push(match[1])
      }
    }
    return images
  }

  const vin = getValue("vin")
  const stockNumber = getValue("stocknumber") || getValue("stock_number") || getValue("dealerstocknum")
  if (vin?.length !== 17) return null
  if (!stockNumber) return null

  const images = getImages()
  const priceDollars = getNumber("price") || getNumber("sellingprice") || getNumber("internetprice") || 0
  const msrpDollars = getNumber("msrp") || getNumber("retailprice")
  const fuelType = getValue("fueltype") || getValue("fuel_type") || getValue("fuel")
  const year = getNumber("year") || new Date().getFullYear()
  const make = getValue("make")
  const model = getValue("model")
  const trim = getValue("trim") || getValue("series")
  const normalizedVin = vin.toUpperCase()
  const mileageKm = getNumber("mileage") || getNumber("odometer") || 0
  const isEv = fuelType?.toLowerCase().includes("electric") || getBoolean("isev")
  const isFeatured = getBoolean("featured")
  const isCertified = getBoolean("certified") || getBoolean("cpo")

  const title = `${year} ${make} ${model}${trim ? ` ${trim}` : ""}`
  const slug = `${year}-${make}-${model}${trim ? `-${trim}` : ""}-${stockNumber}`
    .toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")

  return {
    stock_number: stockNumber,
    vin: normalizedVin,
    slug,
    title,
    dealer_id: "planet-motors",
    source_system: "homenet",
    year,
    make,
    model,
    trim,
    body_style: getValue("bodystyle") || getValue("body") || getValue("bodytype"),
    condition: isCertified ? "certified_used" : "used",
    exterior_color: getValue("exteriorcolor") || getValue("color") || getValue("extcolor"),
    interior_color: getValue("interiorcolor") || getValue("intcolor"),
    doors: getNumber("doors"),
    drivetrain: getValue("drivetrain") || getValue("drivetype"),
    transmission: getValue("transmission") || getValue("trans"),
    engine: getValue("engine") || getValue("enginedescription"),
    fuel_type: fuelType,
    price_cad: priceDollars || undefined,
    sale_price_cad: undefined,
    msrp_cad: msrpDollars || undefined,
    mileage_km: mileageKm,
    status: getValue("status") || "available",
    availability_bucket: "live",
    is_certified: isCertified,
    is_featured: isFeatured,
    is_new_arrival: getBoolean("newarrival"),
    is_ev: isEv,
    fuel_economy_city: getNumber("citympg") || getNumber("fueleconomycity"),
    fuel_economy_highway: getNumber("highwaympg") || getNumber("fueleconomyhighway"),
    battery_capacity_kwh: getNumber("batterycapacity"),
    range_miles: getNumber("range") || getNumber("evrange"),
    primary_image_url: images[0] || getValue("mainphoto") || getValue("primaryimage"),
    image_urls: images,
    has_360_spin: getBoolean("has360") || getBoolean("spinview"),
    video_url: getValue("videourl") || getValue("video"),
    description: getValue("description") || getValue("comments") || undefined,
    options: undefined,
    location: getValue("location") || getValue("dealerlocation") || "Richmond Hill, ON",
    inspection_score: getNumber("inspectionscore") || 210,
    source_vdp_url: undefined,
    title_status: undefined,
    // Legacy compat
    price: (priceDollars || 0) * 100,
    msrp: msrpDollars == null ? undefined : msrpDollars * 100,
    mileage: mileageKm,
    featured: isFeatured,
  }
}

function getTagVariations(tag: string): string[] {
  const base = tag.toLowerCase()
  return [
    base,
    base.replaceAll("_", ""),
    base.replaceAll("_", "-"),
    base.charAt(0).toUpperCase() + base.slice(1),
    base.toUpperCase(),
  ]
}
