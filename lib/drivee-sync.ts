/**
 * Automated Pirelly → Supabase sync for 360° VIN→MID mappings.
 *
 * This module replaces the hardcoded DRIVEE_VIN_MAP with a database-driven
 * approach. The sync pipeline:
 *
 *   1. Fetch all active VINs from the `vehicles` table
 *   2. Query Pirelly API for each VIN to resolve MID
 *   3. Check if frames exist in Supabase Storage
 *   4. Upsert results into `drivee_mappings` table
 *
 * The 360° viewer reads from `drivee_mappings` at runtime — no code deploy
 * needed when vehicles change.
 */

const PIRELLY_BASE =
  "https://us-central1-pirelly360.cloudfunctions.net/iframe-searcher/v2/iframe-repo"
const PIRELLY_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"

const FIREBASE_STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/public-iframe/o"

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ldervbcvkoawwknsemuz.supabase.co"
const BUCKET = "vehicle-360"

export interface SyncResult {
  vin: string
  mid: string | null
  frameCount: number
  framesInStorage: boolean
  framesMigrated: number
  status: "synced" | "no_mid" | "error"
  error?: string
}

/** Query Pirelly API to resolve a VIN to a Drivee media ID. */
export async function resolveMidFromPirelly(vin: string): Promise<string | null> {
  try {
    const url = `${PIRELLY_BASE}?vin=${encodeURIComponent(vin)}&uid=${PIRELLY_UID}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null

    const data = await res.json()
    const src = data?.iframeAttrs?.src ?? ""
    const match = /mid=(\d+)/.exec(src)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/** Also try stock number lookup as fallback. */
export async function resolveMidFromPirellyByStock(
  stock: string,
): Promise<string | null> {
  try {
    const url = `${PIRELLY_BASE}?stock=${encodeURIComponent(stock)}&uid=${PIRELLY_UID}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null

    const data = await res.json()
    const src = data?.iframeAttrs?.src ?? ""
    const match = /mid=(\d+)/.exec(src)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/** Check how many frames exist in Supabase Storage for a given MID. */
export async function countFramesInStorage(mid: string): Promise<number> {
  const MAX_PROBE = 50
  let count = 0

  for (let i = 1; i <= MAX_PROBE; i++) {
    const padded = String(i).padStart(2, "0")
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${mid}/nobg/${padded}.webp`
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5_000) })
      if (!res.ok) break
      count++
    } catch {
      break
    }
  }

  return count
}

/** Count how many frames exist on Drivee's Firebase Storage. */
export async function countFramesOnFirebase(mid: string): Promise<number> {
  const MAX_PROBE = 50
  let count = 0

  for (let i = 1; i <= MAX_PROBE; i++) {
    const padded = String(i).padStart(2, "0")
    const path = `users/${PIRELLY_UID}/models/${mid}/walk-around/${padded}.webp`
    const url = `${FIREBASE_STORAGE_BASE}/${encodeURIComponent(path)}?alt=media`
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5_000) })
      if (!res.ok) break
      count++
    } catch {
      break
    }
  }

  return count
}

/** Migrate frames from Drivee Firebase to Supabase Storage. */
export async function migrateFramesToSupabase(
  mid: string,
  frameCount: number,
  serviceRoleKey: string,
): Promise<number> {
  let migrated = 0

  // Process in batches of 4 to avoid overwhelming either server
  for (let i = 1; i <= frameCount; i += 4) {
    const batch = Array.from(
      { length: Math.min(4, frameCount - i + 1) },
      (_, j) => i + j,
    )

    await Promise.all(
      batch.map(async (frameNum) => {
        const padded = String(frameNum).padStart(2, "0")
        const fbPath = `users/${PIRELLY_UID}/models/${mid}/walk-around/${padded}.webp`
        const fbUrl = `${FIREBASE_STORAGE_BASE}/${encodeURIComponent(fbPath)}?alt=media`
        const storagePath = `${mid}/nobg/${padded}.webp`
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`

        try {
          const fbRes = await fetch(fbUrl, { signal: AbortSignal.timeout(30_000) })
          if (!fbRes.ok) return

          const blob = await fbRes.arrayBuffer()
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "image/webp",
              "x-upsert": "true",
            },
            body: Buffer.from(blob),
            signal: AbortSignal.timeout(30_000),
          })

          if (uploadRes.ok) migrated++
        } catch {
          // Skip failed frames silently — they'll be retried on next sync
        }
      }),
    )
  }

  return migrated
}
