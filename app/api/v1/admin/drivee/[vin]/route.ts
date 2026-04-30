/**
 * Admin endpoint to enable / disable the Drivee 360° viewer for a single VIN.
 *
 * Why this exists:
 *   - Pirelly (Drivee's iframe directory) sometimes returns a wrong MID for a
 *     given VIN — most commonly when a stock # was reused for a new car or
 *     when the same VIN was photographed twice for different paint jobs.
 *   - The customer-facing VDP then renders the wrong vehicle's 360° spin
 *     (e.g., gallery shows red Jeep, 360° tab shows a black Jeep — same VIN).
 *   - The cron-side fix is hard (we don't store Pirelly's vehicle metadata
 *     to compare against ours). Until that's solved, ops needs a one-click
 *     way to suppress 360° for the offending vehicle.
 *
 * Mechanism:
 *   - The Drivee viewer is gated by `drivee_mappings.frames_in_storage`
 *     (see `loadMappings()` in lib/drivee-db.ts). Setting it to `false`
 *     hides the 360° tab for that VIN site-wide.
 *   - In-memory cache (5 min TTL) is invalidated on every toggle so the
 *     change takes effect immediately.
 *
 * Wire format:
 *   PATCH /api/v1/admin/drivee/{VIN}
 *     body: { "disabled": true } | { "disabled": false }
 *     200:  { ok, vin, framesInStorage, message }
 *     401:  unauthorised
 *     404:  no drivee mapping found for that VIN
 *     400:  malformed body
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authoriseAdminOrError } from "@/lib/admin-auth"
import { invalidateDriveeCache } from "@/lib/drivee-db"

export const dynamic = "force-dynamic"

interface PatchBody {
  disabled: boolean
}

function parseBody(raw: unknown): { ok: true; body: PatchBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object" }
  const candidate = raw as Record<string, unknown>
  if (typeof candidate.disabled !== "boolean") {
    return { ok: false, error: "Body must include `disabled: boolean`" }
  }
  return { ok: true, body: { disabled: candidate.disabled } }
}

interface DriveeRow {
  vin: string
  mid: string
  frame_count: number
  frames_in_storage: boolean
  vehicle_name: string | null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> },
): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  const { vin } = await params
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 })
  }

  const parsed = parseBody(json)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const supabase = createAdminClient()

  // Verify the mapping exists; we don't insert new rows here — this endpoint
  // only flips an existing mapping. If no row exists, the cron will create
  // one on the next /api/cron/drivee-sync run.
  const { data: existing, error: fetchError } = await supabase
    .from("drivee_mappings")
    .select("vin, mid, frame_count, frames_in_storage, vehicle_name")
    .eq("vin", vin)
    .maybeSingle<DriveeRow>()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json(
      { error: "No drivee mapping found for that VIN" },
      { status: 404 },
    )
  }

  const targetFlag = !parsed.body.disabled // disabled=true → frames_in_storage=false
  if (existing.frames_in_storage === targetFlag) {
    // No-op: already in the requested state. Still invalidate cache to be safe.
    invalidateDriveeCache()
    return NextResponse.json({
      ok: true,
      vin,
      mid: existing.mid,
      framesInStorage: targetFlag,
      message: `Already ${parsed.body.disabled ? "disabled" : "enabled"} — no change`,
    })
  }

  const { error: updateError } = await supabase
    .from("drivee_mappings")
    .update({
      frames_in_storage: targetFlag,
      updated_at: new Date().toISOString(),
    })
    .eq("vin", vin)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  invalidateDriveeCache()

  return NextResponse.json({
    ok: true,
    vin,
    mid: existing.mid,
    framesInStorage: targetFlag,
    message: parsed.body.disabled
      ? "360° disabled for this VIN — customer VDP no longer shows the Drivee tab"
      : "360° re-enabled for this VIN",
  })
}

/**
 * GET /api/v1/admin/drivee/{VIN}
 *
 * Returns the current drivee_mappings row for diagnostic purposes.
 * Useful for the audit UI before deciding whether to disable.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vin: string }> },
): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  const { vin } = await params
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("drivee_mappings")
    .select("vin, mid, frame_count, frames_in_storage, vehicle_name, source, verified_at, updated_at")
    .eq("vin", vin)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true, mapping: data })
}

/**
 * DELETE /api/v1/admin/drivee/{VIN}
 *
 * Hard-deletes the drivee_mappings row for that VIN. Cleaner than the
 * PATCH-disable approach when the MID is genuinely wrong (Pirelly stock-#
 * fallback collision, photographer typo, etc.) — the row stops existing
 * entirely and the 360° tab vanishes from the customer VDP.
 *
 * What happens on next cron run:
 *   - Cron sees the VIN in `vehicles` but no row in `drivee_mappings`,
 *     so it tries to resolve again.
 *   - If Pirelly returns the same wrong MID via stock# fallback, the new
 *     `findExistingMidConflict` guard (this PR) rejects it with status
 *     'mid_collision'. No bad data is recreated.
 *
 * Returns 200 with the deleted row, 404 if no row existed, 401 if not
 * admin, 400 on bad VIN.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vin: string }> },
): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  const { vin } = await params
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check the row exists first so we can return a proper 404 + include
  // the deleted MID in the response (useful for ops audit logs).
  const { data: existing, error: fetchError } = await supabase
    .from("drivee_mappings")
    .select("vin, mid, vehicle_name")
    .eq("vin", vin)
    .maybeSingle<{ vin: string; mid: string; vehicle_name: string | null }>()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error: deleteError } = await supabase
    .from("drivee_mappings")
    .delete()
    .eq("vin", vin)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  invalidateDriveeCache()

  return NextResponse.json({
    ok: true,
    deleted: existing,
    message: `Mapping deleted. Customer VDP for ${vin} will no longer show the 360° tab.`,
  })
}
