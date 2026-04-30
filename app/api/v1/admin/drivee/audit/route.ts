/**
 * GET /api/v1/admin/drivee/audit
 *
 * Returns every MID currently mapped to MORE than one VIN in
 * `drivee_mappings`. These are bad rows — almost always a Pirelly
 * stock-number-fallback collision (the smoking-gun case behind
 * PR fix/drivee-prevent-mid-collisions).
 *
 * Output shape:
 *   {
 *     ok: true,
 *     collisions: [
 *       { mid: "190171976531", vins: [
 *         { vin, vehicle_name, frames_in_storage, verified_at }, ...
 *       ]},
 *       ...
 *     ]
 *   }
 *
 * Operator workflow:
 *   1. GET this endpoint → list of bad MIDs
 *   2. For each colliding MID, decide which VIN is the rightful owner
 *      (cross-check against the Pirelly iframe page or the photographer)
 *   3. PATCH /api/v1/admin/drivee/{wrong-vin} {"disabled": true}
 *      to suppress the wrong 360° tab on the customer VDP
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

export const dynamic = "force-dynamic"

interface MappingRow {
  vin: string
  mid: string
  vehicle_name: string | null
  frames_in_storage: boolean
  verified_at: string | null
}

interface CollisionGroup {
  mid: string
  vins: Array<{
    vin: string
    vehicle_name: string | null
    frames_in_storage: boolean
    verified_at: string | null
  }>
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

export async function GET(): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  const supabase = createAdminClient()

  // Pull EVERY mapping — including frames_in_storage=false rows. The audit's
  // entire purpose is to surface colliding MIDs across the whole table.
  // Filtering by frames_in_storage=true would hide already-disabled bad
  // mappings, defeating the point. Copilot Autofix tried to add that filter
  // in commit 405ef71a; intentionally NOT included. Dataset is small (one
  // row per VIN, low hundreds at most) so we group in JS instead of using a
  // Postgres window function.
  const { data, error } = await supabase
    .from("drivee_mappings")
    .select("vin, mid, vehicle_name, frames_in_storage, verified_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as MappingRow[]
  const byMid = new Map<string, MappingRow[]>()
  for (const row of rows) {
    if (!row.mid) continue
    const list = byMid.get(row.mid)
    if (list) list.push(row)
    else byMid.set(row.mid, [row])
  }

  const collisions: CollisionGroup[] = []
  for (const [mid, group] of byMid.entries()) {
    if (group.length < 2) continue
    collisions.push({
      mid,
      vins: group.map((r) => ({
        vin: r.vin,
        vehicle_name: r.vehicle_name,
        frames_in_storage: r.frames_in_storage,
        verified_at: r.verified_at,
      })),
    })
  }

  return NextResponse.json({
    ok: true,
    totalMappings: rows.length,
    collisionCount: collisions.length,
    collisions,
  })
}
