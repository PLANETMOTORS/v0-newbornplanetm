/**
 * Maps Canadian postal code prefixes to provinces/regions with market data
 * for trade-in vehicle valuation.
 *
 * First letter of a Canadian postal code identifies the province/territory.
 * Regional multipliers reflect real market differences:
 *  - Trucks & SUVs are worth more in Alberta/Saskatchewan (oil patch demand)
 *  - EVs are worth more in BC & Quebec (provincial incentives, infrastructure)
 *  - Ontario/GTA is the baseline (largest used-car market)
 */

export interface RegionInfo {
  province: string
  regionName: string
  /** General market multiplier vs. Ontario baseline (1.00) */
  multiplier: number
  /** Extra multiplier for trucks/SUVs (stacks with base multiplier) */
  truckBonus: number
  /** Extra multiplier for EVs / PHEVs */
  evBonus: number
  marketDescription: string
}

// First character of postal code → province mapping
const POSTAL_PREFIX_MAP: Record<string, RegionInfo> = {
  // Ontario
  K: { province: "ON", regionName: "Eastern Ontario", multiplier: 0.98, truckBonus: 1, evBonus: 1, marketDescription: "Eastern Ontario (Ottawa/Kingston area)" },
  L: { province: "ON", regionName: "Central Ontario", multiplier: 1, truckBonus: 1, evBonus: 1, marketDescription: "Central Ontario (GTA/Hamilton/Niagara)" },
  M: { province: "ON", regionName: "Toronto", multiplier: 1.02, truckBonus: 0.97, evBonus: 1.05, marketDescription: "Toronto/GTA — largest Canadian used-car market" },
  N: { province: "ON", regionName: "Southwestern Ontario", multiplier: 0.98, truckBonus: 1.02, evBonus: 1, marketDescription: "Southwestern Ontario (London/Windsor)" },
  P: { province: "ON", regionName: "Northern Ontario", multiplier: 0.95, truckBonus: 1.05, evBonus: 0.95, marketDescription: "Northern Ontario (Sudbury/Thunder Bay)" },

  // Quebec
  G: { province: "QC", regionName: "Eastern Quebec", multiplier: 0.95, truckBonus: 1, evBonus: 1.08, marketDescription: "Eastern Quebec (Quebec City area)" },
  H: { province: "QC", regionName: "Montreal", multiplier: 0.98, truckBonus: 0.98, evBonus: 1.1, marketDescription: "Montreal — strong EV incentives & infrastructure" },
  J: { province: "QC", regionName: "Western Quebec", multiplier: 0.96, truckBonus: 1, evBonus: 1.08, marketDescription: "Western Quebec (Gatineau/Sherbrooke)" },

  // British Columbia
  V: { province: "BC", regionName: "British Columbia", multiplier: 1.03, truckBonus: 1, evBonus: 1.12, marketDescription: "British Columbia — highest EV adoption rate, strong used-car market" },

  // Alberta
  T: { province: "AB", regionName: "Alberta", multiplier: 1.02, truckBonus: 1.1, evBonus: 0.92, marketDescription: "Alberta — high truck/SUV demand (oil & gas, rural)" },

  // Saskatchewan
  S: { province: "SK", regionName: "Saskatchewan", multiplier: 0.95, truckBonus: 1.08, evBonus: 0.9, marketDescription: "Saskatchewan — strong truck demand, limited EV infrastructure" },

  // Manitoba
  R: { province: "MB", regionName: "Manitoba", multiplier: 0.96, truckBonus: 1.05, evBonus: 0.93, marketDescription: "Manitoba — moderate market, truck-friendly" },

  // Atlantic provinces
  B: { province: "NS", regionName: "Nova Scotia", multiplier: 0.93, truckBonus: 1.02, evBonus: 0.95, marketDescription: "Nova Scotia — smaller market, salt corrosion factor" },
  C: { province: "PE", regionName: "Prince Edward Island", multiplier: 0.9, truckBonus: 1, evBonus: 0.92, marketDescription: "Prince Edward Island — small island market" },
  E: { province: "NB", regionName: "New Brunswick", multiplier: 0.93, truckBonus: 1.03, evBonus: 0.93, marketDescription: "New Brunswick — bilingual market, salt exposure" },
  A: { province: "NL", regionName: "Newfoundland & Labrador", multiplier: 0.9, truckBonus: 1.05, evBonus: 0.88, marketDescription: "Newfoundland & Labrador — remote market, high shipping costs" },

  // Territories
  X: { province: "NT/NU", regionName: "Northwest Territories / Nunavut", multiplier: 0.85, truckBonus: 1.1, evBonus: 0.8, marketDescription: "Northern territories — very limited market, extreme conditions" },
  Y: { province: "YT", regionName: "Yukon", multiplier: 0.88, truckBonus: 1.08, evBonus: 0.82, marketDescription: "Yukon — small remote market" },
}

const DEFAULT_REGION: RegionInfo = {
  province: "ON",
  regionName: "Ontario (default)",
  multiplier: 1,
  truckBonus: 1,
  evBonus: 1,
  marketDescription: "Ontario/GTA market (default — postal code not recognized)",
}

/** Truck/SUV makes and body styles that get the truck bonus */
const TRUCK_KEYWORDS = ["F-150", "Silverado", "Sierra", "Ram", "Tacoma", "Tundra", "Ranger", "Colorado", "Canyon", "Frontier", "Titan", "Ridgeline", "Maverick"]
const SUV_KEYWORDS = ["4Runner", "Wrangler", "Bronco", "Defender", "Expedition", "Suburban", "Tahoe", "Sequoia", "Armada"]

/** EV / PHEV models that get the EV bonus */
const EV_KEYWORDS = ["Model 3", "Model Y", "Model S", "Model X", "Bolt", "Leaf", "Ioniq", "EV6", "ID.4", "Mach-E", "Lightning", "Ariya", "Solterra", "bZ4X", "Lyriq", "Blazer EV", "Equinox EV", "Polestar"]

export function getRegionFromPostalCode(postalCode?: string): RegionInfo {
  if (!postalCode || postalCode.trim().length === 0) return DEFAULT_REGION
  const firstChar = postalCode.trim().toUpperCase().charAt(0)
  return POSTAL_PREFIX_MAP[firstChar] || DEFAULT_REGION
}

/**
 * Calculate the regional multiplier for a specific vehicle in a specific region.
 * Combines the base regional multiplier with vehicle-type bonuses.
 */
export function getRegionalMultiplier(
  postalCode: string | undefined,
  make: string,
  model: string,
): { multiplier: number; region: RegionInfo; vehicleType: "truck" | "suv" | "ev" | "standard" } {
  const region = getRegionFromPostalCode(postalCode)

  const modelUpper = (model || "").toUpperCase()
  const makeUpper = (make || "").toUpperCase()

  const isTruck = TRUCK_KEYWORDS.some(k => modelUpper.includes(k.toUpperCase()))
  const isSUV = !isTruck && SUV_KEYWORDS.some(k => modelUpper.includes(k.toUpperCase()))
  const isEV = makeUpper === "TESLA" || EV_KEYWORDS.some(k => modelUpper.includes(k.toUpperCase()))

  let multiplier = region.multiplier
  let vehicleType: "truck" | "suv" | "ev" | "standard" = "standard"

  if (isTruck) {
    multiplier *= region.truckBonus
    vehicleType = "truck"
  } else if (isSUV) {
    multiplier *= region.truckBonus // SUVs get partial truck bonus
    vehicleType = "suv"
  }

  if (isEV) {
    multiplier *= region.evBonus
    vehicleType = "ev"
  }

  return { multiplier, region, vehicleType }
}
