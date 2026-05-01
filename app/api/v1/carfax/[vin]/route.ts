/**
 * GET /api/v1/carfax/[vin]
 *
 * Returns the Carfax Canada badge summary for a single VIN.
 * Three layers, in this order:
 *
 *   1. Cache read   — Supabase `carfax_cache` row (24h TTL)
 *   2. Live fetch   — Auth0 client_credentials → Badging API v3
 *   3. Cache write  — UPSERT the fresh summary
 *
 * Stale fallback: if the live fetch fails AND we have any cached row, we
 * serve the cached row with `source: "stale-fallback"` rather than
 * breaking the VDP. Better degraded data than no data during a Carfax
 * outage.
 *
 * Rate limit: 30 req / 60s per IP. The VDP only calls this once per
 * page load so 30/min is generous; cron uses the admin route.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { fetchBadges } from "@/lib/carfax/client"
import {
  getCachedSummary,
  isCacheFresh,
  upsertSummary,
} from "@/lib/carfax/repository"
import {
  errorResponse,
  gateVinAndEnv,
} from "@/lib/carfax/route-helpers"
import type { CarfaxBadgeSummary } from "@/lib/carfax/schemas"

interface RouteContext {
  params: Promise<{ vin: string }>
}

const querySchema = z
  .object({
    force: z.union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")]).optional(),
  })
  .strict()

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") ?? "unknown"
}

function disabledResponse(vin: string): NextResponse {
  return NextResponse.json(
    {
      vin,
      enabled: false,
      summary: null,
      message: "Carfax integration disabled (env vars missing).",
    },
    { status: 200 },
  )
}

function summaryResponse(
  summary: CarfaxBadgeSummary,
  source: "cache" | "live" | "stale-fallback",
): NextResponse {
  return NextResponse.json({
    vin: summary.vin,
    enabled: true,
    source,
    summary,
  })
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { vin: rawVin } = await ctx.params

  const queryRaw = Object.fromEntries(new URL(request.url).searchParams.entries())
  const queryParsed = querySchema.safeParse(queryRaw)
  if (!queryParsed.success) {
    return errorResponse("INVALID_QUERY", "force must be true|false|1|0", 400)
  }
  const force =
    queryParsed.data.force === "true" || queryParsed.data.force === "1"

  const limit = await rateLimit(`carfax:${clientIp(request)}`, 30, 60)
  if (!limit.success) {
    return errorResponse("RATE_LIMITED", "Too many Carfax requests", 429)
  }

  const gate = gateVinAndEnv(rawVin)
  if (!gate.ok) {
    // The disabled (env-missing) gate response is a 503; for the public
    // route we want to render a soft "Carfax off" instead, so we override.
    const status = gate.response.status
    if (status === 503) {
      // Try to extract the VIN from the raw param for the response payload;
      // if the VIN was the actual reason the gate failed, status would be 400.
      return disabledResponse(rawVin.toUpperCase())
    }
    return gate.response
  }
  const { vin, env } = gate.value

  // ── Layer 1: cache hit (when fresh + not forced) ──────────────────────
  const cached = await getCachedSummary(vin)
  if (!force && cached.ok && cached.value && isCacheFresh(cached.value, Date.now())) {
    return summaryResponse(cached.value, "cache")
  }

  // ── Layer 2: live Carfax fetch ────────────────────────────────────────
  const live = await fetchBadges(env, vin)
  if (live.ok) {
    const persisted = await upsertSummary(live.value)
    if (!persisted.ok) {
      logger.warn("[carfax] cache UPSERT failed (returning live anyway)", {
        vin,
        kind: persisted.error.kind,
        message: persisted.error.message,
      })
    }
    return summaryResponse(live.value, "live")
  }

  // ── Layer 3: stale fallback ───────────────────────────────────────────
  if (cached.ok && cached.value) {
    logger.warn("[carfax] live fetch failed, serving stale cache", {
      vin,
      kind: live.error.kind,
    })
    return summaryResponse(cached.value, "stale-fallback")
  }

  logger.error("[carfax] live fetch failed and no cache available", {
    vin,
    kind: live.error.kind,
  })
  return errorResponse("CARFAX_UNAVAILABLE", "Carfax data unavailable", 502, {
    vin,
    kind: live.error.kind,
  })
}
