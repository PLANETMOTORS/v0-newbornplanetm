import type { SqlClient } from "@/lib/neon/sql"

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

// Re-exported from lib/neon/sql so hot endpoints (e.g. /api/health) can
// import the SQL tag without dragging in the 600-line parser module.
// Existing callers continue to import from this file unchanged.
export { getSql, type SqlClient } from "@/lib/neon/sql"

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

function normalizeHomenetFuelType(raw: string): string {
  if (!raw) return raw
  // String-based normalization (no regex) to avoid Sonar S5852 (regex
  // backtracking risk on untrusted CSV input). Strip a trailing
  // "fuel system" or "fuel" suffix, case-insensitive.
  const trimmed = raw.trimEnd()
  const lower = trimmed.toLowerCase()
  for (const suffix of ["fuel system", "fuel"]) {
    if (lower.endsWith(suffix)) {
      return trimmed.slice(0, trimmed.length - suffix.length).trimEnd() || raw
    }
  }
  return raw
}

function composeEngineString(direct: string, cyl: string, disp: string): string {
  if (direct) return direct
  // Skip "0.0", "0.0 L", etc. displacement for EVs
  const validDisp = disp && !/^0+(\.0+)?(\s|$)/.exec(disp) ? disp : ""
  if (validDisp) return validDisp + (cyl ? ` ${cyl}-Cylinder` : "")
  if (cyl && cyl !== "0") return `${cyl}-Cylinder`
  return ""
}

function mapConditionFlags(rawCondition: string, certifiedFlag: boolean, certifiedFlagPresent: boolean):
  { a2Condition: string; isCertified: boolean } {
  const lower = rawCondition.toLowerCase()
  if (lower === "cpo" || lower === "certified" || lower === "certified_used") {
    return { a2Condition: "certified_used", isCertified: true }
  }
  if (lower === "new") {
    return { a2Condition: "new", isCertified: certifiedFlag }
  }
  return { a2Condition: "used", isCertified: certifiedFlagPresent ? certifiedFlag : false }
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
  const fuelType = normalizeHomenetFuelType(get(["fuel_type", "fueltype", "fuel"]))
  const rawImages = get(["image_urls", "photos", "images", "photo", "imagelist"])
  const images = parseImageUrls(rawImages)

  const engineStr = composeEngineString(
    get(["engine", "enginedescription"]),
    get(["enginecylinders"]),
    get(["enginedisplacement"]),
  )

  // HomeNet "Type" column: "Used", "New", "CPO" → A2 condition values
  const certifiedFlagRaw = get(["is_certified", "certified", "cpo"])
  const { a2Condition, isCertified } = mapConditionFlags(
    get(["condition", "type"]),
    getBool(["is_certified", "certified", "cpo"]),
    !!certifiedFlagRaw,
  )

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

  // === A2: Pricing (integer CAD dollars) ===
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

/** Default percentage of live inventory the incoming feed must cover for the
 *  bulk soft-delete to proceed. Tunable via `HOMENET_INVENTORY_FLOOR_PCT`.
 *  Set the env var to 0 to disable the guard for legitimate liquidations. */
const DEFAULT_INVENTORY_FLOOR_PCT = 50

function getInventoryFloorPct(): number {
  const raw = process.env.HOMENET_INVENTORY_FLOOR_PCT
  if (!raw) return DEFAULT_INVENTORY_FLOOR_PCT
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return DEFAULT_INVENTORY_FLOOR_PCT
  }
  return parsed
}

export interface SyncVehiclesResult {
  inserted: number
  updated: number
  /**
   * Number of vehicles soft-deleted (status set to 'sold') in this run.
   * The vehicles' rows are kept in the database so the VDP URL keeps
   * resolving; this preserves SEO equity, lets the SimilarVehicles
   * carousel save the lead, and allows IndexNow to ping search engines
   * with `schema.org/SoldOut` for the existing URL.
   */
  removed: number
  /**
   * IDs of newly inserted vehicles in this run. Used by callers (the
   * HomenetIOL cron) to fire IndexNow pings for fresh URLs without
   * re-querying the database.
   */
  insertedVehicleIds: string[]
  /**
   * IDs of vehicles soft-deleted in this run. Used by callers to fire
   * IndexNow pings so search engines re-crawl and pick up the new
   * SoldOut availability.
   */
  soldVehicleIds: string[]
  /**
   * IDs of vehicles updated (not inserted) in this run. Used by callers
   * to fire IndexNow pings so search engines re-crawl and pick up changes
   * like price updates.
   */
  updatedVehicleIds: string[]
  /**
   * True when the inventory-floor guard fired and the bulk soft-delete
   * was skipped to prevent a partial/truncated CSV from incorrectly
   * marking thousands of vehicles as SOLD. Callers (the cron) MUST
   * skip soft-delete IndexNow pings when this is true.
   */
  safetyAborted: boolean
  /**
   * Diagnostic context populated when `safetyAborted` is true so
   * operators can see, at a glance, why the guard fired.
   */
  safetyContext?: {
    incoming: number
    currentLive: number
    floorPct: number
    minimumExpected: number
  }
  errors: { vin: string; error: string }[]
}

/** Test-only export for the inventory-floor parser. */
export const __testing__ = {
  getInventoryFloorPct,
  DEFAULT_INVENTORY_FLOOR_PCT,
}

/**
 * Full-replacement sync: the incoming file IS the complete inventory.
 * 1. Upsert all vehicles from the file
 * 2. Mark every vehicle NOT in the file as sold (soft-delete)
 *
 * Soft-delete rationale: when a vehicle leaves the HomeNet feed it has
 * almost always been sold. Hard-deleting would orphan the VDP URL,
 * losing SEO equity from old shares/links and removing the chance to
 * cross-sell similar inventory to a returning visitor. Soft-deleting
 * keeps the URL alive, the VDP renders with the existing "Vehicle Sold"
 * banner + Similar Vehicles carousel, and search engines see
 * `schema.org/SoldOut` on re-crawl (already wired in the VDP layout).
 */
interface UpsertAccumulator {
  inserted: number
  updated: number
  insertedVehicleIds: string[]
  updatedVehicleIds: string[]
  errors: { vin: string; error: string }[]
}

/** Upsert a single vehicle row (INSERT … ON CONFLICT UPDATE). */
async function upsertVehicle(
  sql: SqlClient,
  vehicle: VehicleData,
  acc: UpsertAccumulator,
): Promise<void> {
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
      WHERE (
        vehicles.stock_number, vehicles.year, vehicles.make, vehicles.model,
        vehicles.trim, vehicles.body_style, vehicles.exterior_color,
        vehicles.interior_color, vehicles.price, vehicles.msrp,
        vehicles.mileage, vehicles.drivetrain, vehicles.transmission,
        vehicles.engine, vehicles.fuel_type, vehicles.fuel_economy_city,
        vehicles.fuel_economy_highway, vehicles.is_ev, vehicles.battery_capacity_kwh,
        vehicles.range_miles, vehicles.status, vehicles.is_certified,
        vehicles.is_new_arrival, vehicles.featured, vehicles.inspection_score,
        vehicles.primary_image_url, vehicles.image_urls, vehicles.has_360_spin,
        vehicles.video_url, vehicles.location, vehicles.description,
        vehicles.source_vdp_url, vehicles.title_status
      ) IS DISTINCT FROM (
        EXCLUDED.stock_number, EXCLUDED.year, EXCLUDED.make, EXCLUDED.model,
        EXCLUDED.trim, EXCLUDED.body_style, EXCLUDED.exterior_color,
        EXCLUDED.interior_color, EXCLUDED.price, EXCLUDED.msrp,
        EXCLUDED.mileage, EXCLUDED.drivetrain, EXCLUDED.transmission,
        EXCLUDED.engine, EXCLUDED.fuel_type, EXCLUDED.fuel_economy_city,
        EXCLUDED.fuel_economy_highway, EXCLUDED.is_ev, EXCLUDED.battery_capacity_kwh,
        EXCLUDED.range_miles, EXCLUDED.status, EXCLUDED.is_certified,
        EXCLUDED.is_new_arrival, EXCLUDED.featured, EXCLUDED.inspection_score,
        EXCLUDED.primary_image_url, EXCLUDED.image_urls, EXCLUDED.has_360_spin,
        EXCLUDED.video_url, EXCLUDED.location, EXCLUDED.description,
        EXCLUDED.source_vdp_url, EXCLUDED.title_status
      )
      RETURNING id, (xmax = 0) AS inserted
    `
    const rows = result as Array<{ id: string; inserted: boolean }>
    const row = rows?.[0]
    if (row?.inserted) {
      acc.inserted++
      if (row.id) acc.insertedVehicleIds.push(row.id)
    } else if (row?.id) {
      acc.updated++
      acc.updatedVehicleIds.push(row.id)
    }
  } catch (error) {
    console.error(`[HomenetIOL] Error syncing VIN ${vehicle.vin}:`, error)
    acc.errors.push({
      vin: vehicle.vin,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

interface SoftDeleteResult {
  removed: number
  soldVehicleIds: string[]
  safetyAborted: boolean
  safetyContext?: SyncVehiclesResult['safetyContext']
  errors: { vin: string; error: string }[]
}

/** Soft-delete vehicles no longer in the feed, with inventory-floor guard. */
async function softDeleteSoldVehicles(
  sql: SqlClient,
  incomingVins: string[],
): Promise<SoftDeleteResult> {
  const errors: { vin: string; error: string }[] = []
  const soldVehicleIds: string[] = []

  if (incomingVins.length === 0) {
    console.warn(
      `[HomenetIOL] Skipping soft-delete step: no incoming vehicles to compare against`,
    )
    return { removed: 0, soldVehicleIds, safetyAborted: false, errors }
  }

  let currentLive: number | null = null
  try {
    const liveCountRows = (await sql`
      SELECT COUNT(*)::int AS live_count
      FROM vehicles
      WHERE status IS DISTINCT FROM 'sold'
    `) as Array<{ live_count: number }>
    currentLive = liveCountRows?.[0]?.live_count ?? 0
  } catch (error) {
    console.error(
      `[HomenetIOL] Live-count query failed (proceeding without inventory-floor guard):`,
      error,
    )
  }

  const floorPct = getInventoryFloorPct()
  const minimumExpected =
    currentLive !== null && currentLive > 0
      ? Math.floor(currentLive * (floorPct / 100))
      : 0

  if (currentLive !== null && currentLive > 0 && incomingVins.length < minimumExpected) {
    console.error(
      `[HomenetIOL] SAFETY ABORT: incoming feed has ${incomingVins.length} ` +
        `vehicles but database has ${currentLive} live (floor: ${minimumExpected} ` +
        `at ${floorPct}%). Soft-delete SKIPPED to prevent inventory wipe.`,
    )
    return {
      removed: 0,
      soldVehicleIds,
      safetyAborted: true,
      safetyContext: { incoming: incomingVins.length, currentLive, floorPct, minimumExpected },
      errors,
    }
  }

  try {
    const soldResult = await sql`
      UPDATE vehicles
      SET status = 'sold',
          sold_at = COALESCE(sold_at, NOW()),
          updated_at = NOW()
      WHERE vin != ALL(${incomingVins})
        AND status IS DISTINCT FROM 'sold'
      RETURNING id
    `
    const soldRows = soldResult as Array<{ id: string }>
    for (const row of soldRows) {
      if (row.id) soldVehicleIds.push(row.id)
    }
    if (soldRows.length > 0) {
      console.info(`[HomenetIOL] Soft-deleted ${soldRows.length} vehicles not in incoming file`)
    }
    return { removed: soldRows.length, soldVehicleIds, safetyAborted: false, errors }
  } catch (error) {
    console.error(`[HomenetIOL] Error soft-deleting old vehicles:`, error)
    errors.push({
      vin: "BULK_SOFT_DELETE",
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return { removed: 0, soldVehicleIds, safetyAborted: false, errors }
  }
}

export async function syncVehiclesToDatabase(
  sql: SqlClient,
  vehicles: VehicleData[],
): Promise<SyncVehiclesResult> {
  const BATCH_SIZE = 100
  const acc: UpsertAccumulator = {
    inserted: 0, updated: 0,
    insertedVehicleIds: [], updatedVehicleIds: [], errors: [],
  }

  // Step 1: Upsert all vehicles from the file
  for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
    const batch = vehicles.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map((v) => upsertVehicle(sql, v, acc)))
  }

  // Step 2: Soft-delete vehicles no longer in the feed
  const incomingVins = vehicles.map(v => v.vin)
  const sd = await softDeleteSoldVehicles(sql, incomingVins)

  return {
    inserted: acc.inserted,
    updated: acc.updated,
    removed: sd.removed,
    insertedVehicleIds: acc.insertedVehicleIds,
    soldVehicleIds: sd.soldVehicleIds,
    updatedVehicleIds: acc.updatedVehicleIds,
    safetyAborted: sd.safetyAborted,
    safetyContext: sd.safetyContext,
    errors: [...acc.errors, ...sd.errors],
  }
}


// ==================== XML PARSER ====================

export function parseHomenetXML(xmlText: string): VehicleData[] {
  const vehicles: VehicleData[] = []
  const vehicleMatches = Array.from(xmlText.matchAll(/<(vehicle|item|listing)[^>]*>[\s\S]*?<\/\1>/gi), m => m[0])
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

/** Extract the text content of an XML tag, trying multiple case/format variations. */
function getXmlTagValue(xml: string, tag: string): string {
  const variations = getTagVariations(tag)
  for (const variant of variations) {
    const match = new RegExp(`<${variant}[^>]*>([^<]*)</${variant}>`, "i").exec(xml)
    if (match?.[1]) return match[1].trim()
  }
  return ""
}

function getXmlTagNumber(xml: string, tag: string): number | undefined {
  const val = getXmlTagValue(xml, tag)
  const num = Number.parseInt(val.replaceAll(/[^0-9.-]/g, ""), 10)
  return Number.isNaN(num) ? undefined : num
}

function getXmlTagBoolean(xml: string, tag: string): boolean {
  const val = getXmlTagValue(xml, tag).toLowerCase()
  return val === "true" || val === "1" || val === "yes"
}

const XML_IMAGE_PATTERNS = [
  /<photo[^>]*>([^<]+)<\/photo>/gi,
  /<image[^>]*>([^<]+)<\/image>/gi,
  /<imageurl[^>]*>([^<]+)<\/imageurl>/gi,
  /<img[^>]*src="([^"]+)"/gi,
]

function getXmlImages(xml: string): string[] {
  const images: string[] = []
  for (const pattern of XML_IMAGE_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(xml)) !== null) {
      if (match[1]?.startsWith("http")) images.push(match[1])
    }
  }
  return images
}

function parseVehicleFromXML(xml: string): VehicleData | null {
  const vin = getXmlTagValue(xml, "vin")
  const stockNumber = getXmlTagValue(xml, "stocknumber") || getXmlTagValue(xml, "stock_number") || getXmlTagValue(xml, "dealerstocknum")
  if (vin?.length !== 17) return null
  if (!stockNumber) return null

  const images = getXmlImages(xml)
  const priceDollars = getXmlTagNumber(xml, "price") || getXmlTagNumber(xml, "sellingprice") || getXmlTagNumber(xml, "internetprice") || 0
  const msrpDollars = getXmlTagNumber(xml, "msrp") || getXmlTagNumber(xml, "retailprice")
  const fuelType = getXmlTagValue(xml, "fueltype") || getXmlTagValue(xml, "fuel_type") || getXmlTagValue(xml, "fuel")
  const year = getXmlTagNumber(xml, "year") || new Date().getFullYear()
  const make = getXmlTagValue(xml, "make")
  const model = getXmlTagValue(xml, "model")
  const trim = getXmlTagValue(xml, "trim") || getXmlTagValue(xml, "series")
  const normalizedVin = vin.toUpperCase()
  const mileageKm = getXmlTagNumber(xml, "mileage") || getXmlTagNumber(xml, "odometer") || 0
  const isEv = fuelType?.toLowerCase().includes("electric") || getXmlTagBoolean(xml, "isev")
  const isFeatured = getXmlTagBoolean(xml, "featured")
  const isCertified = getXmlTagBoolean(xml, "certified") || getXmlTagBoolean(xml, "cpo")

  const trimSuffix = trim ? ` ${trim}` : ""
  const trimSlugSuffix = trim ? `-${trim}` : ""
  const title = `${year} ${make} ${model}${trimSuffix}`
  const slug = `${year}-${make}-${model}${trimSlugSuffix}-${stockNumber}`
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
    body_style: getXmlTagValue(xml, "bodystyle") || getXmlTagValue(xml, "body") || getXmlTagValue(xml, "bodytype"),
    condition: isCertified ? "certified_used" : "used",
    exterior_color: getXmlTagValue(xml, "exteriorcolor") || getXmlTagValue(xml, "color") || getXmlTagValue(xml, "extcolor"),
    interior_color: getXmlTagValue(xml, "interiorcolor") || getXmlTagValue(xml, "intcolor"),
    doors: getXmlTagNumber(xml, "doors"),
    drivetrain: getXmlTagValue(xml, "drivetrain") || getXmlTagValue(xml, "drivetype"),
    transmission: getXmlTagValue(xml, "transmission") || getXmlTagValue(xml, "trans"),
    engine: getXmlTagValue(xml, "engine") || getXmlTagValue(xml, "enginedescription"),
    fuel_type: fuelType,
    price_cad: priceDollars || undefined,
    sale_price_cad: undefined,
    msrp_cad: msrpDollars || undefined,
    mileage_km: mileageKm,
    status: getXmlTagValue(xml, "status") || "available",
    availability_bucket: "live",
    is_certified: isCertified,
    is_featured: isFeatured,
    is_new_arrival: getXmlTagBoolean(xml, "newarrival"),
    is_ev: isEv,
    fuel_economy_city: getXmlTagNumber(xml, "citympg") || getXmlTagNumber(xml, "fueleconomycity"),
    fuel_economy_highway: getXmlTagNumber(xml, "highwaympg") || getXmlTagNumber(xml, "fueleconomyhighway"),
    battery_capacity_kwh: getXmlTagNumber(xml, "batterycapacity"),
    range_miles: getXmlTagNumber(xml, "range") || getXmlTagNumber(xml, "evrange"),
    primary_image_url: images[0] || getXmlTagValue(xml, "mainphoto") || getXmlTagValue(xml, "primaryimage"),
    image_urls: images,
    has_360_spin: getXmlTagBoolean(xml, "has360") || getXmlTagBoolean(xml, "spinview"),
    video_url: getXmlTagValue(xml, "videourl") || getXmlTagValue(xml, "video"),
    description: getXmlTagValue(xml, "description") || getXmlTagValue(xml, "comments") || undefined,
    options: undefined,
    location: getXmlTagValue(xml, "location") || getXmlTagValue(xml, "dealerlocation") || "Richmond Hill, ON",
    inspection_score: getXmlTagNumber(xml, "inspectionscore") || 210,
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
