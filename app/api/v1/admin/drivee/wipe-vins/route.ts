/**
 * POST /api/v1/admin/drivee/wipe-vins
 *
 * One-shot operator endpoint. Takes a list of VINs and nukes BOTH
 *   1. drivee_mappings rows (so the next sync starts clean)
 *   2. vehicles rows (so a fresh HomeNet push recreates them)
 *
 * Why both tables? HomeNet's UPSERT only touches `vehicles`. The
 * separate `drivee_mappings` table stores wrong MIDs that survive any
 * HomeNet repush. Deleting both lets the operator do a clean
 * "wipe + repush + re-sync" cycle for problem VINs.
 *
 * Designed for the smoking-gun case where two VINs share a MID
 * (1C4JJXP6XMW777356 + 1C4JJXP60MW777382 sharing MID 190171976531).
 *
 * Wire format:
 *   POST /api/v1/admin/drivee/wipe-vins
 *   body: { "vins": ["1C4JJXP6XMW777356", "1C4JJXP60MW777382"] }
 *   200:  { ok, deleted: { vehicles: N, mappings: N }, byVin: [...] }
 *   400:  body invalid
 *   401:  not admin
 *
 * The endpoint is idempotent — re-running with the same VINs is fine
 * and will report 0 deletions if rows are already gone.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"
import { invalidateDriveeCache } from "@/lib/drivee-db"

export const dynamic = "force-dynamic"

interface WipeBody {
  vins: string[]
}

interface PerVinResult {
  vin: string
  vehicleDeleted: boolean
  mappingDeleted: boolean
  vehiclePrev?: { year: number; make: string; model: string }
  mappingPrev?: { mid: string }
  error?: string
}

async function authoriseAdminOrError(): Promise<NextResponse | null> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

function parseBody(raw: unknown): { ok: true; body: WipeBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object" }
  const candidate = raw as Record<string, unknown>
  if (!Array.isArray(candidate.vins)) {
    return { ok: false, error: "Body must include `vins: string[]`" }
  }
  if (candidate.vins.length === 0) {
    return { ok: false, error: "`vins` array must not be empty" }
  }
  if (candidate.vins.length > 50) {
    return { ok: false, error: "Maximum 50 VINs per request" }
  }
  for (const vin of candidate.vins) {
    if (typeof vin !== "string" || vin.length !== 17) {
      return { ok: false, error: `Invalid VIN: ${String(vin)} (must be 17-char string)` }
    }
  }
  return { ok: true, body: { vins: candidate.vins as string[] } }
}

interface VehicleRow {
  vin: string
  year: number
  make: string
  model: string
}
interface MappingRow {
  vin: string
  mid: string
}

async function wipeOneVin(
  supabase: ReturnType<typeof createAdminClient>,
  vin: string,
): Promise<PerVinResult> {
  const result: PerVinResult = { vin, vehicleDeleted: false, mappingDeleted: false }

  try {
    // 1. Snapshot then delete drivee_mappings row (if any)
    const { data: mappingPrev } = await supabase
      .from("drivee_mappings")
      .select("vin, mid")
      .eq("vin", vin)
      .maybeSingle<MappingRow>()

    if (mappingPrev) {
      const { error: mappingDeleteError } = await supabase
        .from("drivee_mappings")
        .delete()
        .eq("vin", vin)
      if (mappingDeleteError) {
        result.error = `mappings: ${mappingDeleteError.message}`
        return result
      }
      result.mappingDeleted = true
      result.mappingPrev = { mid: mappingPrev.mid }
    }

    // 2. Snapshot then delete vehicles row (if any). FKs are mostly
    //    ON DELETE CASCADE / SET NULL — see scripts/001_create_vehicles_schema.sql.
    //    The one RESTRICT is on `orders.vehicle_id` (scripts/004_*); the delete
    //    will surface that as an error so the operator knows to resolve the
    //    order first.
    const { data: vehiclePrev } = await supabase
      .from("vehicles")
      .select("vin, year, make, model")
      .eq("vin", vin)
      .maybeSingle<VehicleRow>()

    if (vehiclePrev) {
      const { error: vehicleDeleteError } = await supabase
        .from("vehicles")
        .delete()
        .eq("vin", vin)
      if (vehicleDeleteError) {
        result.error = `vehicles: ${vehicleDeleteError.message}`
        return result
      }
      result.vehicleDeleted = true
      result.vehiclePrev = {
        year: vehiclePrev.year,
        make: vehiclePrev.make,
        model: vehiclePrev.model,
      }
    }

    return result
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Unknown error"
    return result
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 })
  }

  const parsed = parseBody(json)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const supabase = createAdminClient()
  const byVin: PerVinResult[] = []
  let vehiclesDeleted = 0
  let mappingsDeleted = 0
  let errors = 0

  for (const vin of parsed.body.vins) {
    const r = await wipeOneVin(supabase, vin)
    byVin.push(r)
    if (r.vehicleDeleted) vehiclesDeleted++
    if (r.mappingDeleted) mappingsDeleted++
    if (r.error) errors++
  }

  // Flush the in-memory drivee cache so any deleted mapping is gone
  // from the customer VDP within seconds rather than the 5-min TTL.
  invalidateDriveeCache()

  return NextResponse.json({
    ok: errors === 0,
    summary: {
      requested: parsed.body.vins.length,
      vehiclesDeleted,
      mappingsDeleted,
      errors,
    },
    byVin,
    nextSteps: [
      "Push the fresh HomeNet file — both VINs will be re-inserted with corrected data",
      "Trigger drivee-sync: POST /api/v1/admin/drivee-sync?vin=<VIN>",
      "Verify on the customer VDP that the right vehicle's photos render",
    ],
  })
}
