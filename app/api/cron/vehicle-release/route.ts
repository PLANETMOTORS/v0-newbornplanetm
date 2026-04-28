import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyCronSecret } from "@/lib/security/cron-auth"

/**
 * Vercel Cron Job: Auto-Release Stuck Vehicles
 *
 * Runs every 10 minutes (configured in vercel.json).
 * Releases vehicles that have been stuck in transitional states:
 *   - checkout_in_progress → available  after 30 minutes
 *   - reserved             → available  after 48 hours (no confirmed deposit)
 *
 * This prevents inventory from being permanently locked when a customer
 * abandons checkout or a deal falls through.
 */

export const maxDuration = 30
export const dynamic = "force-dynamic"

interface ReleasedVehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  previousStatus: string
}

type AdminClient = ReturnType<typeof createAdminClient>
type StaleVehicle = { id: string; vin: string; year: number; make: string; model: string }

async function releaseStaleCheckouts(
  adminClient: AdminClient,
  released: ReleasedVehicle[],
  errors: string[],
): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: stale, error } = await adminClient
    .from("vehicles")
    .select("id, vin, year, make, model")
    .eq("status", "checkout_in_progress")
    .lt("updated_at", cutoff)
  if (error) {
    errors.push(`checkout query: ${error.message}`)
    return
  }
  for (const v of stale ?? []) {
    const { error: updateErr } = await adminClient
      .from("vehicles")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", v.id)
      .eq("status", "checkout_in_progress")
    if (updateErr) {
      errors.push(`release ${v.vin}: ${updateErr.message}`)
    } else {
      released.push({ ...(v as StaleVehicle), previousStatus: "checkout_in_progress" })
    }
  }
}

async function hasActiveReservation(adminClient: AdminClient, vehicleId: string): Promise<{ active: boolean; error?: string }> {
  const { data, error } = await adminClient
    .from("reservations")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .in("status", ["confirmed", "pending"])
    .limit(1)
  if (error) return { active: false, error: error.message }
  return { active: !!(data && data.length > 0) }
}

async function releaseStaleReservations(
  adminClient: AdminClient,
  released: ReleasedVehicle[],
  errors: string[],
): Promise<void> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: stale, error } = await adminClient
    .from("vehicles")
    .select("id, vin, year, make, model")
    .eq("status", "reserved")
    .lt("updated_at", cutoff)
  if (error) {
    errors.push(`reserved query: ${error.message}`)
    return
  }
  for (const v of stale ?? []) {
    const check = await hasActiveReservation(adminClient, v.id)
    if (check.error) {
      errors.push(`reservation check ${v.vin}: ${check.error}`)
      continue
    }
    if (check.active) continue
    const { error: updateErr } = await adminClient
      .from("vehicles")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", v.id)
      .eq("status", "reserved")
    if (updateErr) {
      errors.push(`release ${v.vin}: ${updateErr.message}`)
    } else {
      released.push({ ...(v as StaleVehicle), previousStatus: "reserved" })
    }
  }
}

export async function GET(request: Request) {
  const startTime = Date.now()

  const auth = verifyCronSecret(request)
  if (!auth.ok) return auth.response

  let adminClient: AdminClient
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 })
  }

  const released: ReleasedVehicle[] = []
  const errors: string[] = []

  try {
    await releaseStaleCheckouts(adminClient, released, errors)
    await releaseStaleReservations(adminClient, released, errors)

    const duration = Date.now() - startTime
    console.info(
      `[Vehicle Release] Released ${released.length} vehicles in ${duration}ms.` +
      (errors.length ? ` Errors: ${errors.length}` : "")
    )
    return NextResponse.json({
      success: true,
      released: released.length,
      vehicles: released.map((v) => `${v.year} ${v.make} ${v.model} (${v.vin}) — was ${v.previousStatus}`),
      errors: errors.length > 0 ? errors : undefined,
      duration,
    })
  } catch (err) {
    console.error("[Vehicle Release] Fatal error:", err)
    return NextResponse.json(
      { error: "Vehicle release failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
