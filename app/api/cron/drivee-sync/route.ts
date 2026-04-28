import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyCronSecret } from "@/lib/security/cron-auth"
import {
  resolveMidFromPirelly,
  resolveMidFromPirellyByStock,
  countFramesInStorage,
  type SyncResult,
} from "@/lib/drivee-sync"
import { invalidateDriveeCache } from "@/lib/drivee-db"

/**
 * Vercel Cron Job: Drivee 360° MID Resolution
 *
 * Runs every 6 hours (configured in vercel.json).
 * For each vehicle in inventory that does NOT yet have a drivee_mappings entry,
 * queries the Pirelly API to resolve VIN → MID and upserts into the DB.
 *
 * This ensures newly photographed vehicles automatically get their 360° viewer
 * enabled without manual admin action.
 *
 * Only syncs vehicles missing from drivee_mappings to keep runtime short.
 */

export const maxDuration = 120
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const startTime = Date.now()

  const auth = verifyCronSecret(request)
  if (!auth.ok) return auth.response

  try {
    const supabase = createAdminClient()

    // Step 1: Get all vehicle VINs from inventory
    const { data: allVehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("vin, stock_number, year, make, model")
      .not("vin", "is", null)
      .order("created_at", { ascending: false })

    if (vehiclesError || !allVehicles) {
      throw new Error(vehiclesError?.message ?? "Failed to fetch vehicles")
    }

    // Step 2: Get existing mappings to find gaps
    const { data: existingMappings } = await supabase
      .from("drivee_mappings")
      .select("vin")

    const mappedVins = new Set((existingMappings ?? []).map((m) => m.vin))

    // Only sync vehicles that don't have a mapping yet
    const unmappedVehicles = allVehicles.filter((v) => !mappedVins.has(v.vin))

    if (unmappedVehicles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All vehicles already mapped",
        total: allVehicles.length,
        mapped: mappedVins.size,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      })
    }

    console.info(
      `[Drivee Cron] Syncing ${unmappedVehicles.length} unmapped vehicles (${mappedVins.size} already mapped)`
    )

    const results: SyncResult[] = []
    let synced = 0
    let noMid = 0
    let errors = 0

    for (const vehicle of unmappedVehicles) {
      const { vin, stock_number, year, make, model } = vehicle
      const vehicleName = `${year} ${make} ${model}`

      try {
        // Resolve MID from Pirelly (try VIN first, then stock number)
        let mid = await resolveMidFromPirelly(vin)
        if (!mid && stock_number) {
          mid = await resolveMidFromPirellyByStock(stock_number)
        }

        if (!mid) {
          results.push({ vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0, status: "no_mid" })
          noMid++
          continue
        }

        // Check frames in Supabase Storage
        const storageCount = await countFramesInStorage(mid)
        const framesInStorage = storageCount > 0

        // Upsert to drivee_mappings
        const { error: upsertError } = await supabase
          .from("drivee_mappings")
          .upsert(
            {
              vin,
              mid,
              frame_count: storageCount,
              frames_in_storage: framesInStorage,
              vehicle_name: vehicleName,
              source: "pirelly",
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "vin" },
          )
        if (upsertError) throw upsertError

        results.push({ vin, mid, frameCount: storageCount, framesInStorage, framesMigrated: 0, status: "synced" })
        synced++
      } catch (err) {
        results.push({
          vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0,
          status: "error", error: err instanceof Error ? err.message : "Unknown error",
        })
        errors++
      }
    }

    // Invalidate cache so subsequent requests see new data
    if (synced > 0) invalidateDriveeCache()

    const duration = Date.now() - startTime
    console.info(`[Drivee Cron] Complete in ${duration}ms: ${synced} synced, ${noMid} no MID, ${errors} errors`)

    return NextResponse.json({
      success: true,
      summary: { total: allVehicles.length, alreadyMapped: mappedVins.size, attempted: unmappedVehicles.length, synced, noMid, errors },
      results: results.slice(0, 50), // Cap response size
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Drivee Cron] Fatal error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration_ms: Date.now() - startTime,
    }, { status: 500 })
  }
}
