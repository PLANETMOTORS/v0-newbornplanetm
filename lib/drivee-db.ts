/**
 * Database-driven VIN → Drivee MID lookup.
 *
 * Reads from the `drivee_mappings` table in Supabase instead of the hardcoded
 * DRIVEE_VIN_MAP. Falls back to the static map if the DB query fails (e.g.
 * during local development without Supabase credentials).
 *
 * The table is kept in sync by the Pirelly auto-sync pipeline
 * (POST /api/v1/admin/drivee-sync).
 */

import { createStaticClient } from "@/lib/supabase/static"
import { DRIVEE_VIN_MAP } from "@/lib/drivee"

interface DriveeMapping {
  vin: string
  mid: string
  frame_count: number
  frames_in_storage: boolean
  vehicle_name: string | null
}

/**
 * In-memory cache for DB mappings.
 * Refreshed every 5 minutes to avoid hammering the DB on every request.
 */
let _cache: Map<string, DriveeMapping> | null = null
let _cacheTs = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function loadMappings(): Promise<Map<string, DriveeMapping>> {
  const now = Date.now()
  if (_cache && now - _cacheTs < CACHE_TTL_MS) return _cache

  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from("drivee_mappings")
      .select("vin, mid, frame_count, frames_in_storage, vehicle_name")
      .eq("frames_in_storage", true)

    if (error || !data || data.length === 0) throw error ?? new Error("No data")

    const map = new Map<string, DriveeMapping>()
    for (const row of data as unknown as DriveeMapping[]) {
      map.set(row.vin, row)
    }

    _cache = map
    _cacheTs = now
    return map
  } catch {
    // Fallback: build map from static DRIVEE_VIN_MAP
    if (_cache) return _cache // return stale cache if available

    const map = new Map<string, DriveeMapping>()
    for (const [vin, mid] of Object.entries(DRIVEE_VIN_MAP)) {
      map.set(vin, {
        vin,
        mid,
        frame_count: 0,
        frames_in_storage: true,
        vehicle_name: null,
      })
    }
    _cache = map
    _cacheTs = Date.now()
    return map
  }
}

/**
 * Pre-warm the Drivee mappings cache. Fire-and-forget safe.
 * Call this early (e.g. in parallel with another Supabase query)
 * so subsequent `getDriveeMidFromDb` calls resolve from memory.
 */
export function preloadDriveeMappings(): Promise<void> {
  return loadMappings().then(() => undefined)
}

/**
 * Look up the Drivee media ID for a given VIN.
 * Reads from the database (with in-memory cache), falls back to static map.
 */
export async function getDriveeMidFromDb(
  vin: string | null | undefined,
): Promise<string | null> {
  if (!vin) return null

  const mappings = await loadMappings()
  const entry = mappings.get(vin)
  return entry?.mid ?? null
}

/**
 * Get the full mapping entry for a VIN (includes frame count, storage status).
 */
export async function getDriveeMappingFromDb(
  vin: string | null | undefined,
): Promise<DriveeMapping | null> {
  if (!vin) return null

  const mappings = await loadMappings()
  return mappings.get(vin) ?? null
}

/**
 * Get all known MIDs that have frames in storage.
 * Used by the 360-frames API to validate MID requests.
 */
export async function getKnownMids(): Promise<Set<string>> {
  const mappings = await loadMappings()
  const mids = new Set<string>()
  for (const entry of mappings.values()) {
    if (entry.frames_in_storage) mids.add(entry.mid)
  }
  return mids
}

/** Force-refresh the cache (e.g. after a sync). */
export function invalidateDriveeCache(): void {
  _cache = null
  _cacheTs = 0
}
