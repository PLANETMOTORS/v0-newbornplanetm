import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

export async function GET(request: Request) {
  const startTime = Date.now()

  // Verify cron secret (Vercel sets CRON_SECRET automatically).
  //
  // In production, an unset CRON_SECRET means the env is misconfigured —
  // we MUST fail closed. The previous `if (cronSecret && ...)` form silently
  // skipped the auth check whenever the env var was missing, which would
  // expose the endpoint to anyone on the internet.
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not set" },
      { status: 503 }
    )
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 })
  }

  const released: ReleasedVehicle[] = []
  const errors: string[] = []

  try {
    // 1. Release checkout_in_progress vehicles older than 30 minutes
    const checkoutCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: staleCheckouts, error: checkoutErr } = await adminClient
      .from("vehicles")
      .select("id, vin, year, make, model")
      .eq("status", "checkout_in_progress")
      .lt("updated_at", checkoutCutoff)

    if (checkoutErr) {
      errors.push(`checkout query: ${checkoutErr.message}`)
    } else if (staleCheckouts && staleCheckouts.length > 0) {
      for (const v of staleCheckouts) {
        const { error: updateErr } = await adminClient
          .from("vehicles")
          .update({ status: "available", updated_at: new Date().toISOString() })
          .eq("id", v.id)
          .eq("status", "checkout_in_progress")

        if (updateErr) {
          errors.push(`release ${v.vin}: ${updateErr.message}`)
        } else {
          released.push({ ...v, previousStatus: "checkout_in_progress" })
        }
      }
    }

    // 2. Release reserved vehicles older than 48 hours (no confirmed deposit)
    const reservedCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: staleReserved, error: reservedErr } = await adminClient
      .from("vehicles")
      .select("id, vin, year, make, model")
      .eq("status", "reserved")
      .lt("updated_at", reservedCutoff)

    if (reservedErr) {
      errors.push(`reserved query: ${reservedErr.message}`)
    } else if (staleReserved && staleReserved.length > 0) {
      for (const v of staleReserved) {
        // Check if there's an active confirmed reservation before releasing
        const { data: activeRes, error: resErr } = await adminClient
          .from("reservations")
          .select("id")
          .eq("vehicle_id", v.id)
          .in("status", ["confirmed", "pending"])
          .limit(1)

        if (resErr) {
          errors.push(`reservation check ${v.vin}: ${resErr.message}`)
          continue
        }

        if (activeRes && activeRes.length > 0) {
          // Vehicle has an active reservation — skip it
          continue
        }

        const { error: updateErr } = await adminClient
          .from("vehicles")
          .update({ status: "available", updated_at: new Date().toISOString() })
          .eq("id", v.id)
          .eq("status", "reserved")

        if (updateErr) {
          errors.push(`release ${v.vin}: ${updateErr.message}`)
        } else {
          released.push({ ...v, previousStatus: "reserved" })
        }
      }
    }

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
      { status: 500 }
    )
  }
}
