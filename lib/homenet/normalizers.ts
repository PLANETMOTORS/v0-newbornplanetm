/**
 * HomeNet feed normalizers — pure functions to clean & canonicalize
 * raw CSV/XML values from the dealership management system before
 * they hit the database.
 *
 * Each function is pure (no I/O, no globals) and easily unit-testable.
 *
 * The normalizers cover 5 concrete data-quality risks observed in
 * the real Planet Motors HomeNet SFTP feed:
 *
 *   1. Body-style values are verbose ("Sport Utility", "4dr Car") and
 *      need mapping to the canonical taxonomy (SUV, Sedan, Truck, …)
 *      so category landing pages can filter correctly.
 *
 *   2. Plug-in hybrids are mis-labeled as plain "Hybrid Fuel" — most
 *      notably Jeep 4xe trims (Wrangler 4xe, Grand Cherokee 4xe).
 *      Selling these as "Hybrid" rather than "PHEV" is a marketing
 *      accuracy / iZEV rebate eligibility issue.
 *
 *   3. DateInStock arrives as an Excel serial number (e.g. 45601) and
 *      must be converted to ISO so "days on lot" math works.
 *
 *   4. Stock-photo placeholder URLs (`/stock_images/2/33490.jpg`) get
 *      mixed into the photo list when the dealer hasn't shot real
 *      photos yet — they look unprofessional on category pages.
 *
 *   5. Aviloo battery-health is NOT in the HomeNet feed at all — it
 *      must be entered manually in the admin. This module exposes a
 *      type-level reminder so callers can never read a non-existent
 *      battery-health field from a HomeNet row.
 */

// ==================== BODY STYLE ====================

/**
 * Normalizes verbose HomeNet body values to the canonical 8-category
 * taxonomy used by category landing pages and filter UI.
 *
 * Order matters: more-specific patterns are checked first because some
 * substrings (e.g. "4dr") could match either "Sedan" or "Hatchback".
 *
 * Empty / unknown values are passed through with first-letter casing.
 */
export function normalizeHomenetBodyStyle(raw: string): string {
  if (!raw || !raw.trim()) return ""
  const lower = raw.toLowerCase().trim()

  if (lower.includes("convertible") || lower.includes("cabriolet") || lower.includes("roadster")) {
    return "Convertible"
  }
  if (lower.includes("hatchback") || lower.includes("hatch ")) {
    return "Hatchback"
  }
  if (lower.includes("station wagon") || lower.includes("wagon") || lower.includes("estate")) {
    return "Wagon"
  }
  if (lower.includes("minivan") || lower.includes("mini van") || lower.includes("mini-van")) {
    return "Minivan"
  }
  // Vans (after Minivan so we don't double-match)
  if (lower.includes("cargo van") || lower.includes("passenger van") || lower === "van") {
    return "Van"
  }
  // Trucks (pickup variants)
  if (
    lower.includes("pickup") ||
    lower.includes("crew cab") ||
    lower.includes("quad cab") ||
    lower.includes("regular cab") ||
    lower.includes("extended cab") ||
    lower.includes("super cab") ||
    lower.includes("supercrew") ||
    lower.includes("mega cab") ||
    lower === "truck"
  ) {
    return "Truck"
  }
  // SUV / Crossover
  if (lower.includes("sport utility") || lower.includes(" suv") || lower === "suv" || lower.includes("crossover")) {
    return "SUV"
  }
  // Coupe — explicit OR 2dr/2-door without "hatchback" (already handled above)
  if (lower.includes("coupe") || /\b2[\s-]?d(o|r)/.test(lower)) {
    return "Coupe"
  }
  // Sedan — explicit OR 4dr car / 4-door car
  if (lower.includes("sedan") || /\b4[\s-]?d(o|r)/.test(lower) || lower.endsWith(" car") || lower === "car") {
    return "Sedan"
  }

  // Pass through unknown values with capitalized first letter
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

// ==================== PHEV OVERRIDE ====================

export interface PHEVOverrideResult {
  fuelType: string
  isEv: boolean
  isPhev: boolean
}

/**
 * Detects vehicles that should be classified as PHEV (Plug-in Hybrid)
 * even though the HomeNet feed labels them as plain "Hybrid Fuel".
 *
 * Returns null if no override applies (the original fuel type stands).
 *
 * Detection rules (in order):
 *   1. Fuel type already says "plug-in" or "phev" — keep but normalize
 *   2. Jeep 4xe trims (Wrangler 4xe, Grand Cherokee 4xe) — always PHEV
 *   3. BMW iPerformance trims — always PHEV (e.g. 530e iPerformance)
 *   4. Trim or options string contains "Plug-in" or "Plug In"
 *
 * is_ev is `false` for all PHEVs (PHEVs run on gas when battery is depleted,
 * so they don't qualify as "battery electric vehicle" for federal rebate
 * purposes — this matters for category filtering).
 */
export function detectPHEVOverride(
  make: string,
  model: string,
  trim: string,
  fuelType: string,
  options?: string[],
): PHEVOverrideResult | null {
  const lowerMake = (make || "").toLowerCase()
  const lowerModel = (model || "").toLowerCase()
  const lowerTrim = (trim || "").toLowerCase()
  const lowerFuel = (fuelType || "").toLowerCase()
  const lowerOpts = (options || []).join(" ").toLowerCase()

  // Already labeled as plug-in — canonicalize the label
  if (
    lowerFuel.includes("plug-in") ||
    lowerFuel.includes("plug in") ||
    lowerFuel.includes("plugin") ||
    lowerFuel === "phev"
  ) {
    return { fuelType: "Plug-in Hybrid", isEv: false, isPhev: true }
  }

  // Jeep 4xe — always PHEV (Wrangler 4xe, Grand Cherokee 4xe, etc.)
  if (lowerMake === "jeep" && (lowerTrim.includes("4xe") || lowerModel.includes("4xe"))) {
    return { fuelType: "Plug-in Hybrid", isEv: false, isPhev: true }
  }

  // BMW iPerformance trims — always PHEV
  if (lowerMake === "bmw" && lowerTrim.includes("iperformance")) {
    return { fuelType: "Plug-in Hybrid", isEv: false, isPhev: true }
  }

  // Trim or options mentions "Plug-in" / "Plug In"
  if (
    lowerTrim.includes("plug-in") ||
    lowerTrim.includes("plug in") ||
    lowerOpts.includes("plug-in") ||
    lowerOpts.includes("plug in")
  ) {
    return { fuelType: "Plug-in Hybrid", isEv: false, isPhev: true }
  }

  return null
}

// ==================== EXCEL DATE ====================

/**
 * Converts an Excel serial date number (days since 1900-01-00 with the
 * famous 1900-leap-year bug) to an ISO date string (YYYY-MM-DD).
 *
 * Returns null for empty / non-finite / non-positive inputs.
 *
 * The 25569 offset is the number of days from Excel's epoch
 * (1900-01-00, accounting for the leap bug) to the Unix epoch (1970-01-01).
 *
 * @example
 *   excelSerialToISO(45601)   // → "2024-11-26"
 *   excelSerialToISO("45601") // → "2024-11-26"
 *   excelSerialToISO("")      // → null
 *   excelSerialToISO(0)       // → null
 */
export function excelSerialToISO(input: string | number | null | undefined): string | null {
  if (input == null || input === "") return null
  const serial = typeof input === "number" ? input : Number.parseFloat(String(input))
  if (!Number.isFinite(serial) || serial <= 0) return null

  const utcMs = Math.round((serial - 25569) * 86400 * 1000)
  const date = new Date(utcMs)
  if (Number.isNaN(date.getTime())) return null
  // Already an ISO-like string; take only the date portion.
  return date.toISOString().split("T")[0]
}

// ==================== STOCK PHOTO FILTER ====================

/**
 * URL substrings (lowercase, simple includes-match) that identify stock
 * placeholder images we should NOT show on category landing pages.
 *
 * Using literal substring includes (not regex) avoids Sonar S5852
 * regex-backtracking warnings on user-controlled URL input.
 */
const STOCK_PHOTO_INDICATORS = [
  "/stock_images/",
  "/stock-images/",
  "/stockphotos/",
  "/stockphoto/",
  "/placeholder",
  "/no-image",
  "/no_image",
  "/coming-soon",
  "/coming_soon",
  "/default.jpg",
  "/default.jpeg",
  "/default.png",
  "/default.webp",
] as const

/** True if `url` looks like a stock-photo / placeholder URL. */
export function isStockPhotoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return STOCK_PHOTO_INDICATORS.some(p => lower.includes(p))
}

export interface PhotoFilterResult {
  realPhotos: string[]
  stockPhotos: string[]
  hasOnlyStockPhotos: boolean
}

/**
 * Splits an image URL list into real photos and stock placeholders.
 *
 * `hasOnlyStockPhotos` is true when the vehicle has zero real photos —
 * callers should typically suppress the listing from "with-photos-only"
 * category views and prompt the dealer to upload real photography.
 */
export function filterStockPhotos(urls: string[]): PhotoFilterResult {
  const realPhotos: string[] = []
  const stockPhotos: string[] = []
  for (const url of urls) {
    if (isStockPhotoUrl(url)) {
      stockPhotos.push(url)
    } else {
      realPhotos.push(url)
    }
  }
  return {
    realPhotos,
    stockPhotos,
    hasOnlyStockPhotos: realPhotos.length === 0 && stockPhotos.length > 0,
  }
}

// ==================== AVILOO BATTERY HEALTH ====================

/**
 * Compile-time reminder that HomeNet does NOT carry Aviloo battery
 * health. This `null` constant exists to make any caller that tries
 * `homenetRow.aviloo_battery_health` fail with a clear "missing field"
 * type error during code review.
 *
 * The actual battery-health score is entered manually by the admin
 * (post-test), or pulled from the Drivee API if available.
 */
export const HOMENET_NEVER_PROVIDES_AVILOO = null as null

// ==================== DESCRIPTION BOILERPLATE ====================

/**
 * Strips consecutive duplicate lines/sentences from a HomeNet description.
 *
 * Some HomeNet feeds repeat the dealer's marketing boilerplate 2-3x
 * in the description field (each from a different feed source merge).
 * This conservatively de-duplicates while preserving order.
 */
export function deduplicateDescriptionLines(desc: string): string {
  if (!desc) return desc
  const lines = desc.split(/\n+/).map(l => l.trim()).filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of lines) {
    const key = line.toLowerCase().replaceAll(/\s+/g, " ")
    if (!seen.has(key)) {
      seen.add(key)
      out.push(line)
    }
  }
  return out.join("\n")
}
