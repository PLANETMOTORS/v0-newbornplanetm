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
 *
 * To add a new vehicle:
 *  1. Photograph it using the Drivee app on the lot
 *  2. Query the Pirelly API or log into the Drivee dashboard to find the MID
 *  3. Copy the MID (numeric ID) and add a VIN → MID line below
 *
 * To bulk-lookup MIDs for new inventory, use:
 *   curl -s "https://us-central1-pirelly360.cloudfunctions.net/iframe-searcher/v2/iframe-repo?vin=<VIN>&uid=AZYuEtjX9NUvWpqmUQcKyiGHbNg1"
 *
 * Vehicles WITHOUT an entry here will NOT show the 360° button on the VDP.
 */
export const DRIVEE_VIN_MAP: Record<string, string> = {
  // ── Active inventory (verified via Pirelly API 2026-04-18) ──────────
  "1C4JJXP6XMW777356": "190171976531",  // 2021 Jeep Wrangler 4xe — black
  "1C4JJXP60MW777382": "190171976531",  // 2021 Jeep Wrangler 4xe — black (same shoot)
  "3GN7DSRR5SS127703": "744761075195",  // 2025 Chevrolet Equinox EV — white/red interior
  "LRW3E1EBXPC876367": "132601940353",  // 2023 Tesla Model 3 Long Range (confirmed via Pirelly)
  "3VV4X7B24PM371188": "806787519944",  // 2023 Volkswagen Taos
  "LRW3E7FAXRC093951": "890747363179",  // 2024 Tesla Model 3
  "5YJ3E1EA7KF321382": "640326639530",  // 2019 Tesla Model 3
  "5YJ3E1EC5NF234540": "061789806057",  // 2022 Tesla Model 3 Performance
  "3VV2B7AX2JM008723": "396425623701",  // 2018 Volkswagen Tiguan
  "KM8HC3A62SU023138": "625294835450",  // 2025 Hyundai Kona Electric
  "WA1GCCFS9JR009139": "085109772520",  // 2018 Audi Q3
  "5YJ3E1EA9MF973939": "860125156862",  // 2021 Tesla Model 3

  // ── Legacy VINs (may have been sold) ────────────────────────────────
  "1C4JXRN68MW508009": "190171976531",  // 2021 Jeep Wrangler 4xe (sold)

  // ── Pirelly MID confirmed but frames NOT yet in Supabase Storage ────
  // Need to run: scripts/migrate-360-to-supabase.ts for these MIDs
  // "5YJ3E1EA3MF848712": "181836743021",  // 2021 Tesla Model 3 — Pirelly MID, frames not migrated

  // ── Not yet photographed with Drivee (no MID in Pirelly API) ────────
  // "LRW3E7EB6RC102901":  null,  // 2024 Tesla Model 3 Long Range
  // "LRW3E7FA5RC089290":  null,  // 2024 Tesla Model 3
  // "7SAYGDEE9PF600377":  null,  // 2023 Tesla Model Y Long Range
  // "LRW3E1EB3PC943116":  null,  // 2023 Tesla Model 3 Long Range
  // "7SAYGDEF1NF374938":  null,  // 2022 Tesla Model Y Performance
  // "7SAYGAEE0NF323551":  null,  // 2022 Tesla Model Y Long Range
  // "7SAYGAEE2NF381838":  null,  // 2022 Tesla Model Y Long Range
  // "5YJSA1E64NF476477":  null,  // 2022 Tesla Model S Plaid
  // "5YJYGDED2MF121136":  null,  // 2021 Tesla Model Y Standard Range
}

/** Look up the Drivee media ID for a given VIN. Returns null if not found. */
export function getDriveeMid(vin: string | null | undefined): string | null {
  if (!vin) return null
  return DRIVEE_VIN_MAP[vin] ?? null
}
