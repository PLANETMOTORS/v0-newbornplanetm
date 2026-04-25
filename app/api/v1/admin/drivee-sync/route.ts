import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"
import {
  resolveMidFromPirelly,
  resolveMidFromPirellyByStock,
  countFramesInStorage,
  countFramesOnFirebase,
  migrateFramesToSupabase,
  type SyncResult,
} from "@/lib/drivee-sync"
import { invalidateDriveeCache } from "@/lib/drivee-db"
import { getSupabaseServiceRoleKey } from "@/lib/supabase/config"
import type { SupabaseClient } from "@supabase/supabase-js"

type VehicleRow = { vin: string; stock_number: string | null; year: number; make: string; model: string }
type SyncAdminResult = SyncResult & { synced: boolean; noMid: boolean; framesMigrated: number }

async function syncAdminVehicle(supabase: SupabaseClient, vehicle: VehicleRow, shouldMigrate: boolean, dryRun: boolean, serviceRoleKey: string): Promise<SyncAdminResult> {
  const { vin, stock_number, year, make, model } = vehicle
  const vehicleName = `${year} ${make} ${model}`
  try {
    let mid = await resolveMidFromPirelly(vin)
    if (!mid && stock_number) mid = await resolveMidFromPirellyByStock(stock_number)
    if (!mid) return { vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0, status: "no_mid", synced: false, noMid: true }
    let storageCount = await countFramesInStorage(mid)
    let framesMigrated = 0
    if (storageCount === 0 && shouldMigrate && !dryRun) {
      const firebaseCount = await countFramesOnFirebase(mid)
      if (firebaseCount > 0) { framesMigrated = await migrateFramesToSupabase(mid, firebaseCount, serviceRoleKey); storageCount = framesMigrated }
    }
    const framesInStorage = storageCount > 0
    if (!dryRun) {
      const { error: upsertError } = await supabase.from("drivee_mappings").upsert({ vin, mid, frame_count: storageCount, frames_in_storage: framesInStorage, vehicle_name: vehicleName, source: "pirelly", verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "vin" })
      if (upsertError) throw upsertError
    }
    return { vin, mid, frameCount: storageCount, framesInStorage, framesMigrated, status: "synced", synced: true, noMid: false }
  } catch (err) {
    return { vin, mid: null, frameCount: 0, framesInStorage: false, framesMigrated: 0, status: "error", error: err instanceof Error ? err.message : "Unknown error", synced: false, noMid: false }
  }
}

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
export async function POST(request: NextRequest) {
  // Auth guard — same pattern as all other admin API routes
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  let synced = 0
  let noMid = 0
  let errors = 0
  let framesMigratedTotal = 0

  for (const vehicle of vinsToSync) {
    const result = await syncAdminVehicle(supabase, vehicle, shouldMigrate, dryRun, serviceRoleKey)
    results.push(result)
    if (result.synced) { synced++; framesMigratedTotal += result.framesMigrated }
    else if (result.noMid) noMid++
    else if (result.status === "error") errors++
  }

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
  // Auth guard
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
