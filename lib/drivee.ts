/**
 * Drivee.ai 360° viewer configuration
 *
 * Drivee's iframe only supports the `mid` (media ID) parameter.
 * VIN-based lookup is NOT supported — the iframe ignores unknown params.
 *
 * To add a new vehicle:
 * 1. Photograph it using the Drivee app
 * 2. Get the MID from Drivee's dashboard
 * 3. Add the VIN → MID mapping below
 */

export const DRIVEE_DEALER_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"

/**
 * VIN → Drivee media ID mapping.
 * These are vehicles photographed with Drivee's 360° system.
 */
export const DRIVEE_VIN_MAP: Record<string, string> = {
  // Current inventory — mapped from Drivee photography sessions
  "5YJ3E1EA1PF000001": "132601940353",  // Mock Tesla Model 3 (dev testing — remove before prod)
  "1C4JJXP6XMW777356": "190171976531",  // 2021 Jeep Wrangler 4xe (lot unit)
  "1C4JJXP60MW777382": "190171976531",  // 2021 Jeep Wrangler 4xe (second unit)
  "3GN7DSRR5SS127703": "744761075195",  // 2025 Chevrolet Equinox EV
  "5YJ3E1EA3MF848712": "132601940353",  // 2021 Tesla Model 3
  // Legacy VINs (may have been sold)
  "1C4JXRN68MW508009": "190171976531",  // 2021 Jeep Wrangler 4xe (sold)
  "3VV4B7AX1SM019897": "744761075195",  // 2025 Chevrolet Equinox EV (sold)
  "5YJ3E1EB4MF062024": "132601940353",  // 2021 Tesla Model 3 (sold)
}

/** Look up the Drivee media ID for a given VIN. Returns null if not found. */
export function getDriveeMid(vin: string | null | undefined): string | null {
  if (!vin) return null
  return DRIVEE_VIN_MAP[vin] ?? null
}
