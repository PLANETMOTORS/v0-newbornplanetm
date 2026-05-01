/**
 * POST /api/v1/admin/carfax/[vin]/refetch
 *
 * Admin-gated force-refresh of the Carfax cache for a single VIN.
 * Bypasses the 24h TTL and the public route's rate limit.
 *
 * Permission: requires `vehicles:full` (managers + admins, not viewers).
 */

import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import { logger } from "@/lib/logger"
import { fetchBadges } from "@/lib/carfax/client"
import { upsertSummary } from "@/lib/carfax/repository"
import { errorResponse, gateVinAndEnv } from "@/lib/carfax/route-helpers"

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
  const gate = gateVinAndEnv(rawVin)
  if (!gate.ok) return gate.response
  const { vin, env } = gate.value

  const live = await fetchBadges(env, vin)
  if (!live.ok) {
    logger.error("[carfax-refetch] live fetch failed", {
      vin,
      kind: live.error.kind,
      role: auth.value.role,
    })
    return errorResponse("CARFAX_FETCH_FAILED", "Carfax fetch failed", 502, {
      kind: live.error.kind,
    })
  }

  const persisted = await upsertSummary(live.value)
  if (!persisted.ok) {
    logger.error("[carfax-refetch] UPSERT failed", {
      vin,
      kind: persisted.error.kind,
      message: persisted.error.message,
      role: auth.value.role,
    })
    return errorResponse(
      "CARFAX_PERSIST_FAILED",
      "Failed to persist Carfax data",
      500,
    )
  }

  logger.info("[carfax-refetch] ok", {
    vin,
    role: auth.value.role,
    hasReport: live.value.hasReport,
  })
  return NextResponse.json({ summary: live.value })
}
