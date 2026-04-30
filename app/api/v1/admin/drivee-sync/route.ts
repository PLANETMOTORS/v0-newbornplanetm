import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authoriseAdminOrError } from "@/lib/admin"
import {
  resolveMidFromPirelly,
  resolveMidFromPirellyByStock,
  countFramesInStorage,
  countFramesOnFirebase,
  migrateFramesToSupabase,
  findExistingMidConflict,
  type SyncResult,
} from "@/lib/drivee-sync"
import { invalidateDriveeCache } from "@/lib/drivee-db"
import { getSupabaseServiceRoleKey } from "@/lib/supabase/config"

/**
 * POST /api/v1/admin/drivee-sync
 *
 * Automated Pirelly → Supabase sync pipeline.
 *
 * For each active vehicle in the inventory:
 *   1. Query Pirelly API for VIN → MID resolution
 *   2. Check if frames exist in Supabase Storage
 *   3. If frames are on Firebase but not Supabase, migrate them
 *   4. Upsert the mapping into `drivee_mappings` table
 *
 * Query params:
 *   - vin: Sync a single VIN (optional, syncs all if omitted)
 *   - migrate: "true" to also migrate frames from Firebase → Supabase (default: true)
 *   - dry_run: "true" to preview changes without writing to DB
 *
 * Returns a summary of all sync results.
 */
type AdminSupabase = ReturnType<typeof createAdminClient>
type SyncTarget = { vin: string; stock_number: string | null; year: number; make: string; model: string }

function noMidResult(vin: string): { result: SyncResult; framesMigrated: number } {
  return {
    result: { vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0, status: "no_mid" },
    framesMigrated: 0,
  }
}

function collisionResult(vin: string, mid: string, existingVin: string): { result: SyncResult; framesMigrated: number } {
  return {
    result: { vin, mid, frameCount: 0, framesInStorage: false, framesMigrated: 0, status: "mid_collision", collisionWith: existingVin },
    framesMigrated: 0,
  }
}

async function ensureFrames(
  mid: string, shouldMigrate: boolean, dryRun: boolean, serviceRoleKey: string,
): Promise<{ storageCount: number; framesMigrated: number }> {
  let storageCount = await countFramesInStorage(mid)
  let framesMigrated = 0
  if (storageCount === 0 && shouldMigrate && !dryRun) {
    const firebaseCount = await countFramesOnFirebase(mid)
    if (firebaseCount > 0) {
      framesMigrated = await migrateFramesToSupabase(mid, firebaseCount, serviceRoleKey)
      storageCount = framesMigrated
    }
  }
  return { storageCount, framesMigrated }
}

async function syncSingleDriveeVehicle(
  supabase: AdminSupabase,
  vehicle: SyncTarget,
  shouldMigrate: boolean,
  dryRun: boolean,
  serviceRoleKey: string,
): Promise<{ result: SyncResult; framesMigrated: number }> {
  const { vin, stock_number, year, make, model } = vehicle
  const vehicleName = `${year} ${make} ${model}`
  try {
    let mid = await resolveMidFromPirelly(vin)
    if (!mid && stock_number) mid = await resolveMidFromPirellyByStock(stock_number)
    if (!mid) return noMidResult(vin)

    const conflict = await findExistingMidConflict(supabase, mid, vin)
    if (conflict.conflict) {
      console.warn(
        `[Admin Drivee Sync] MID collision for VIN ${vin}: MID ${mid} is already ` +
          `mapped to ${conflict.existingVin}. Refusing to store duplicate.`,
      )
      return collisionResult(vin, mid, conflict.existingVin)
    }

    const { storageCount, framesMigrated } = await ensureFrames(mid, shouldMigrate, dryRun, serviceRoleKey)
    const framesInStorage = storageCount > 0
    if (!dryRun) {
      const { error: upsertError } = await supabase
        .from("drivee_mappings")
        .upsert(
          {
            vin, mid, frame_count: storageCount, frames_in_storage: framesInStorage,
            vehicle_name: vehicleName, source: "pirelly",
            verified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          },
          { onConflict: "vin" },
        )
      if (upsertError) throw upsertError
    }
    return {
      result: { vin, mid, frameCount: storageCount, framesInStorage, framesMigrated, status: "synced" },
      framesMigrated,
    }
  } catch (err) {
    return {
      result: {
        vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0,
        status: "error", error: err instanceof Error ? err.message : "Unknown error",
      },
      framesMigrated: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await authoriseAdminOrError()
  if (unauthorized) return unauthorized

  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Missing service role key" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const singleVin = searchParams.get("vin")
  const shouldMigrate = searchParams.get("migrate") !== "false"
  const dryRun = searchParams.get("dry_run") === "true"

  const supabase = createAdminClient()

  // Fetch inventory VINs
  let vinsToSync: Array<{ vin: string; stock_number: string | null; year: number; make: string; model: string }>

  if (singleVin) {
    const { data } = await supabase
      .from("vehicles")
      .select("vin, stock_number, year, make, model")
      .eq("vin", singleVin)
      .limit(1)
    vinsToSync = data ?? []
  } else {
    const { data } = await supabase
      .from("vehicles")
      .select("vin, stock_number, year, make, model")
      .not("vin", "is", null)
      .order("created_at", { ascending: false })
    vinsToSync = data ?? []
  }

  if (vinsToSync.length === 0) {
    return NextResponse.json({ error: "No vehicles found to sync", results: [] }, { status: 404 })
  }

  const results: SyncResult[] = []
  let framesMigratedTotal = 0

  for (const vehicle of vinsToSync) {
    const { result, framesMigrated } = await syncSingleDriveeVehicle(supabase, vehicle, shouldMigrate, dryRun, serviceRoleKey)
    results.push(result)
    framesMigratedTotal += framesMigrated
  }

  const synced = results.filter((r) => r.status === "synced").length
  const noMid = results.filter((r) => r.status === "no_mid").length
  const errors = results.filter((r) => r.status === "error").length

  // Invalidate the in-memory drivee cache so subsequent requests see new data
  if (!dryRun) invalidateDriveeCache()

  return NextResponse.json({
    summary: {
      total: vinsToSync.length,
      synced,
      noMid,
      errors,
      framesMigrated: framesMigratedTotal,
      dryRun,
    },
    results,
  })
}

/**
 * GET /api/v1/admin/drivee-sync
 *
 * Returns current state of all drivee_mappings from the database.
 */
export async function GET() {
  const unauthorized = await authoriseAdminOrError()
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("drivee_mappings")
    .select("*")
    .order("verified_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    count: data?.length ?? 0,
    mappings: data ?? [],
  })
}
