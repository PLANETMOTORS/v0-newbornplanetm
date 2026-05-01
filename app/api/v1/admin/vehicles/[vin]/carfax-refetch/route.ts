/**
 * POST /api/v1/admin/vehicles/[vin]/carfax-refetch
 *
 * Admin-gated force-refresh of the Carfax cache for a single VIN.
 * Bypasses the 24h TTL and the public route's rate limit.
 *
 * Permission: requires `vehicles:full` (managers + admins, not viewers).
 */

import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import { logger } from "@/lib/logger"
import { fetchBadges, normaliseVin } from "@/lib/carfax/client"
import { readCarfaxEnv } from "@/lib/carfax/env"
import { upsertSummary } from "@/lib/carfax/repository"

interface RouteContext {
  params: Promise<{ vin: string }>
}

export async function POST(
  _request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const auth = await requirePermission("vehicles", "full")
  if (!auth.ok) return auth.error

  const { vin: rawVin } = await ctx.params
  const vinResult = normaliseVin(rawVin)
  if (!vinResult.ok) {
    return NextResponse.json(
      { error: { code: "INVALID_VIN", message: "VIN must be 17 alphanumeric characters" } },
      { status: 400 },
    )
  }
  const vin = vinResult.value

  const env = readCarfaxEnv()
  if (!env) {
    return NextResponse.json(
      { error: { code: "CARFAX_DISABLED", message: "Carfax env vars not configured" } },
      { status: 503 },
    )
  }

  const live = await fetchBadges(env, vin)
  if (!live.ok) {
    logger.error("[carfax-refetch] live fetch failed", {
      vin,
      kind: live.error.kind,
      by: auth.value.email,
    })
    return NextResponse.json(
      { error: { code: "CARFAX_FETCH_FAILED", kind: live.error.kind } },
      { status: 502 },
    )
  }

  const persisted = await upsertSummary(live.value)
  if (!persisted.ok) {
    logger.error("[carfax-refetch] UPSERT failed", {
      vin,
      kind: persisted.error.kind,
      message: persisted.error.message,
    })
    return NextResponse.json(
      {
        error: {
          code: "CARFAX_PERSIST_FAILED",
          message: persisted.error.message,
        },
      },
      { status: 500 },
    )
  }

  logger.info("[carfax-refetch] ok", {
    vin,
    by: auth.value.email,
    role: auth.value.role,
    hasReport: live.value.hasReport,
  })
  return NextResponse.json({ summary: live.value })
}
