/**
 * Shared CSV row → VehicleData mapper.
 *
 * Extracted from parser.ts so both the legacy (full-array) parser and the
 * new streaming parser can reuse the exact same mapping logic. This module
 * is intentionally stateless — one row in, one VehicleData out.
 */
import type { VehicleData } from "./parser"
import {
  normalizeHomenetBodyStyle,
  detectPHEVOverride,
  excelSerialToISO,
  filterStockPhotos,
  deduplicateDescriptionLines,
} from "./normalizers"

// ==================== HELPERS ====================

function get(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ""
}

function getNum(row: Record<string, string>, keys: string[]): number | undefined {
  const val = get(row, keys)
  const num = Number.parseInt(val.replaceAll(/[^0-9.-]/g, ""), 10)
  return Number.isNaN(num) ? undefined : num
}

function getBool(row: Record<string, string>, keys: string[]): boolean {
  const val = get(row, keys).toLowerCase()
  return val === "true" || val === "1" || val === "yes"
}

function normalizeHomenetFuelType(raw: string): string {
  if (!raw) return raw
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
  const validDisp = disp && !/^0+(\.0+)?(\s|$)/.exec(disp) ? disp : ""
  if (validDisp) return validDisp + (cyl ? ` ${cyl}-Cylinder` : "")
  if (cyl && cyl !== "0") return `${cyl}-Cylinder`
  return ""
}

function mapConditionFlags(
  rawCondition: string,
  certifiedFlag: boolean,
  certifiedFlagPresent: boolean,
): { a2Condition: string; isCertified: boolean } {
  const lower = rawCondition.toLowerCase()
  if (lower === "cpo" || lower === "certified" || lower === "certified_used") {
    return { a2Condition: "certified_used", isCertified: true }
  }
  if (lower === "new") {
    return { a2Condition: "new", isCertified: certifiedFlag }
  }
  return {
    a2Condition: "used",
    isCertified: certifiedFlagPresent ? certifiedFlag : false,
  }
}

function parseImageUrls(raw: string): string[] {
  if (!raw) return []
  if (raw.includes("|")) {
    return raw.split("|").map((u) => u.trim()).filter((u) => u.startsWith("http"))
  }
  return raw.split(",").map((u) => u.trim()).filter((u) => u.startsWith("http"))
}

// ==================== MAIN MAPPER ====================

/**
 * Map a single CSV row (already header-normalised) to a VehicleData object.
 * Returns null for invalid rows (bad VIN, missing stock number).
 */
export function mapCSVRowToVehicle(
  row: Record<string, string>,
): VehicleData | null {
  const vin = get(row, ["vin"])
  const stockNumber = get(row, [
    "stock_number", "stocknumber", "dealerstocknum", "stock",
  ])
  if (vin?.length !== 17) return null
  if (!stockNumber) return null

  let fuelType = normalizeHomenetFuelType(
    get(row, ["fuel_type", "fueltype", "fuel"]),
  )
  const rawImages = get(row, [
    "image_urls", "photos", "images", "photo", "imagelist",
  ])
  const allImages = parseImageUrls(rawImages)
  const photoFilter = filterStockPhotos(allImages)
  const images =
    photoFilter.realPhotos.length > 0 ? photoFilter.realPhotos : allImages
  const hasRealPhotos = photoFilter.realPhotos.length > 0

  const engineStr = composeEngineString(
    get(row, ["engine", "enginedescription"]),
    get(row, ["enginecylinders"]),
    get(row, ["enginedisplacement"]),
  )

  const certifiedFlagRaw = get(row, ["is_certified", "certified", "cpo"])
  const { a2Condition, isCertified } = mapConditionFlags(
    get(row, ["condition", "type"]),
    getBool(row, ["is_certified", "certified", "cpo"]),
    !!certifiedFlagRaw,
  )

  const year = getNum(row, ["year"]) || new Date().getFullYear()
  const make = get(row, ["make"])
  const model = get(row, ["model"])
  const trim = get(row, ["trim", "series"])
  const normalizedVin = vin.toUpperCase()
  const mileageKm = getNum(row, ["mileage", "odometer", "miles"]) || 0

  const rawBodyStyle = get(row, [
    "body_style", "bodystyle", "body", "bodytype",
  ])
  const bodyStyle = normalizeHomenetBodyStyle(rawBodyStyle)

  const trimSuffix = trim ? ` ${trim}` : ""
  const trimSlugSuffix = trim ? `-${trim}` : ""
  const title = `${year} ${make} ${model}${trimSuffix}`
  const slug = `${year}-${make}-${model}${trimSlugSuffix}-${stockNumber}`
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")

  const priceDollars = getNum(row, [
    "price", "sellingprice", "internetprice", "internet_price",
  ])
  const msrpDollars = getNum(row, ["msrp", "retailprice", "originalmsrp"])

  const rawStatus = get(row, ["status"]).toLowerCase()
  const a2Status = rawStatus || "available"
  let availabilityBucket = "live"
  if (a2Status === "sold") availabilityBucket = "sold"
  else if (a2Status === "wholesale" || a2Status === "draft")
    availabilityBucket = "hidden"

  const rawOptions = get(row, ["options"])
  const optionsList = rawOptions
    ? rawOptions.split(",").map((o) => o.trim()).filter(Boolean)
    : undefined

  const doors = getNum(row, ["doors"])
  const rawDescription = get(row, ["comments", "description", "comment1"])
  const description = rawDescription
    ? deduplicateDescriptionLines(rawDescription)
    : undefined
  const dateInStock =
    excelSerialToISO(get(row, ["dateinstock", "date_in_stock"])) ?? undefined

  const phevOverride = detectPHEVOverride(
    make, model, trim, fuelType, optionsList,
  )
  let isEv =
    fuelType?.toLowerCase().includes("electric") ||
    getBool(row, ["is_ev", "isev"])
  if (phevOverride) {
    fuelType = phevOverride.fuelType
    isEv = phevOverride.isEv
  }

  const isFeatured = getBool(row, ["featured", "is_featured"])

  return {
    stock_number: stockNumber,
    vin: normalizedVin,
    slug,
    title,
    dealer_id: get(row, ["dealerid", "dealer_id"]) || "planet-motors",
    source_system: "homenet",
    year,
    make,
    model,
    trim,
    body_style: bodyStyle,
    condition: a2Condition,
    exterior_color: get(row, [
      "exterior_color", "exteriorcolor", "color", "extcolor",
    ]),
    interior_color: get(row, [
      "interior_color", "interiorcolor", "intcolor",
    ]),
    doors,
    drivetrain: get(row, ["drivetrain", "drivetype"]),
    transmission: get(row, ["transmission", "trans"]),
    engine: engineStr,
    fuel_type: fuelType,
    price_cad: priceDollars || undefined,
    sale_price_cad: undefined,
    msrp_cad: msrpDollars || undefined,
    mileage_km: mileageKm,
    status: a2Status,
    availability_bucket: availabilityBucket,
    is_certified: isCertified,
    is_featured: isFeatured,
    is_new_arrival: getBool(row, ["is_new_arrival", "newarrival"]),
    is_ev: isEv,
    fuel_economy_city: getNum(row, ["fuel_economy_city", "citympg"]),
    fuel_economy_highway: getNum(row, ["fuel_economy_highway", "highwaympg"]),
    battery_capacity_kwh: getNum(row, [
      "battery_capacity_kwh", "batterycapacity",
    ]),
    range_miles: getNum(row, ["range_miles", "range", "evrange"]),
    primary_image_url:
      images[0] || get(row, ["primary_image_url", "mainphoto"]),
    image_urls: images,
    has_360_spin: getBool(row, ["has_360_spin", "has360"]),
    video_url: get(row, ["video_url", "video"]),
    description,
    feature_bullets: undefined,
    options: optionsList,
    location: get(row, ["location", "dealerlocation"]) || "Richmond Hill, ON",
    date_in_stock: dateInStock,
    has_real_photos: hasRealPhotos,
    inspection_score:
      getNum(row, ["inspection_score", "inspectionscore"]) || 210,
    source_vdp_url: get(row, ["vdplink", "vdp_link"]) || undefined,
    title_status: get(row, ["titlestatus", "title_status"]) || undefined,
    price: (priceDollars || 0) * 100,
    msrp: msrpDollars == null ? undefined : msrpDollars * 100,
    mileage: mileageKm,
    featured: isFeatured,
  }
}
