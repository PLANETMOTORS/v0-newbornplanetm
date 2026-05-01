/**
 * GET /api/v1/vehicles/[vin]/carfax
 *
 * Returns the Carfax Canada badge summary for a single VIN.
 * Composed of three layers:
 *
 *   1. Cache read   — Supabase `carfax_cache` row
 *   2. Live fetch   — Auth0 client_credentials → Badging API v3
 *   3. Cache write  — UPSERT the fresh summary so the next caller hits L1
 *
 * The cache TTL is 24 h. Anything stale OR a `?force=true` query string
 * triggers a live fetch. The cache layer absorbs Carfax outages: stale
 * data is preferable to a broken VDP, so we serve the cached row and
 * surface { stale: true } in the response.
 *
 * Rate limit: 30 requests / 60s per IP. The VDP only calls this once per
 * page load so this is generous; cron jobs use the admin re-fetch route.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { fetchBadges, normaliseVin } from "@/lib/carfax/client"
import { readCarfaxEnv } from "@/lib/carfax/env"
import {
  getCachedSummary,
  isCacheFresh,
  upsertSummary,
} from "@/lib/carfax/repository"
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

  const vinResult = normaliseVin(rawVin)
  if (!vinResult.ok) {
    return NextResponse.json(
      { error: { code: "INVALID_VIN", message: "VIN must be 17 alphanumeric characters" } },
      { status: 400 },
    )
  }
  const vin = vinResult.value

  const queryRaw = Object.fromEntries(new URL(request.url).searchParams.entries())
  const queryParsed = querySchema.safeParse(queryRaw)
  if (!queryParsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_QUERY", message: "force must be true|false|1|0" } },
      { status: 400 },
    )
  }
  const force =
    queryParsed.data.force === "true" || queryParsed.data.force === "1"

  // Light rate limit so a hot inventory page can't melt Carfax.
  const limit = await rateLimit(`carfax:${clientIp(request)}`, 30, 60)
  if (!limit.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many Carfax requests" } },
      { status: 429 },
    )
  }

  const env = readCarfaxEnv()
  if (!env) return disabledResponse(vin)

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

  // ── Layer 3: graceful degradation ─────────────────────────────────────
  // Live fetch failed — if we still have a cached row (any age), serve it
  // with a stale flag so the VDP can render. Better to show old badges than
  // a broken section during a Carfax outage.
  if (cached.ok && cached.value) {
    logger.warn("[carfax] live fetch failed, serving stale cache", {
      vin,
      kind: live.error.kind,
    })
    return summaryResponse(cached.value, "stale-fallback")
  }

  // No cache, no live data — surface the failure so the client can render
  // the no-Carfax fallback section.
  logger.error("[carfax] live fetch failed and no cache available", {
    vin,
    kind: live.error.kind,
  })
  return NextResponse.json(
    {
      vin,
      enabled: true,
      source: "error",
      summary: null,
      error: { code: "CARFAX_UNAVAILABLE", kind: live.error.kind },
    },
    { status: 502 },
  )
}
