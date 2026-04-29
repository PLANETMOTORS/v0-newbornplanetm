/**
 * app/api/health/route.ts
 *
 * Liveness + freshness probe for Planet Motors.
 *
 * Returns HTTP 200 when ALL of:
 *   - The Neon `vehicles` table is reachable
 *   - At least one vehicle row exists
 *   - MAX(vehicles.updated_at) is within FRESHNESS_WINDOW_MIN
 *
 * Returns HTTP 503 otherwise. External monitors (Better Stack, UptimeRobot,
 * Cloudflare healthchecks) should alert on non-200.
 *
 * Design notes:
 *   - Public, unauthenticated. Matches Kubernetes / Vercel / UptimeRobot
 *     probe convention. No PII or stack traces are returned.
 *   - Cache-Control: no-store. Probes must hit the live DB on every call.
 *   - Single SELECT round-trip (~10 ms). Safe to poll at 60 s cadence.
 *   - We deliberately avoid the apiSuccess() envelope from lib/api-response.
 *     External monitors expect a flat shape with `.ok` at root.
 *   - Vehicles live in Neon (DATABASE_URL). We reuse getSql() so this probe
 *     stays in lock-step with the cron handler that produces the freshness
 *     signal: app/api/cron/homenet-sync/route.ts → vehicles.updated_at.
 *   - We import from `lib/neon/sql` (a tiny, side-effect-free module) rather
 *     than `lib/homenet/parser` (600+ lines of CSV parsing) to keep this
 *     hot-polled endpoint cheap to cold-start.
 */

import { NextResponse } from "next/server"
import { getSql } from "@/lib/neon/sql"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 10

// HomeNet cron schedule is */15 * * * * (vercel.json).
// 20 min = one full period + 5 min slack for SFTP latency.
const FRESHNESS_WINDOW_MIN = 20

interface CheckResult {
  ok: boolean
  [key: string]: unknown
}

interface HealthChecks {
  homenet_sync: CheckResult
  inventory: CheckResult
}

interface HealthResponse {
  ok: boolean
  checks: HealthChecks
  checked_at: string
  duration_ms: number
}

interface FreshnessRow {
  vehicle_count: number
  last_sync_at: string | null
}

const PROBE_HEADERS = {
  "Cache-Control": "no-store, must-revalidate",
  "X-Robots-Tag": "noindex",
} as const

function buildResponse(
  ok: boolean,
  checks: HealthChecks,
  startedAt: number,
  checkedAt: string,
): NextResponse {
  const body: HealthResponse = {
    ok,
    checks,
    checked_at: checkedAt,
    duration_ms: Date.now() - startedAt,
  }
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: PROBE_HEADERS,
  })
}

function fail(
  homenetSync: CheckResult,
  inventory: CheckResult,
  startedAt: number,
  checkedAt: string,
): NextResponse {
  return buildResponse(false, { homenet_sync: homenetSync, inventory }, startedAt, checkedAt)
}

function evaluateInventory(vehicleCount: number): CheckResult {
  if (vehicleCount > 0) {
    return { ok: true, vehicle_count: vehicleCount }
  }
  return { ok: false, error: "empty_inventory", vehicle_count: 0 }
}

function evaluateHomenetSync(lastSyncAt: string | null): CheckResult {
  if (!lastSyncAt) {
    return { ok: false, error: "no_sync_yet" }
  }
  const ageMin = (Date.now() - new Date(lastSyncAt).getTime()) / 60_000
  const fresh = ageMin <= FRESHNESS_WINDOW_MIN
  const base = {
    last_sync_at: lastSyncAt,
    age_min: Number(ageMin.toFixed(2)),
    max_age_min: FRESHNESS_WINDOW_MIN,
  }
  return fresh ? { ok: true, ...base } : { ok: false, error: "sync_stale", ...base }
}

export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now()
  const checkedAt = new Date().toISOString()

  const sql = getSql()
  if (!sql) {
    const unconfigured: CheckResult = { ok: false, error: "db_unconfigured" }
    return fail(unconfigured, unconfigured, startedAt, checkedAt)
  }

  let row: FreshnessRow | undefined
  try {
    const rows = (await sql`
      SELECT
        COUNT(*)::int                AS vehicle_count,
        MAX(updated_at)::timestamptz AS last_sync_at
      FROM vehicles
    `) as FreshnessRow[]
    row = rows[0]
  } catch (error) {
    logger.error("[health]", "DB probe failed", error)
    const dbError: CheckResult = { ok: false, error: "db_error" }
    return fail(dbError, dbError, startedAt, checkedAt)
  }

  const inventory = evaluateInventory(row?.vehicle_count ?? 0)
  const homenetSync = evaluateHomenetSync(row?.last_sync_at ?? null)
  const ok = inventory.ok === true && homenetSync.ok === true

  return buildResponse(ok, { homenet_sync: homenetSync, inventory }, startedAt, checkedAt)
}
