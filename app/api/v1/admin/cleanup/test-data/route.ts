/**
 * POST /api/v1/admin/cleanup/test-data
 *
 * One-shot ops endpoint to delete test rows that accumulated during
 * pre-launch QA. Targets the three tables most polluted by test sessions:
 *   - leads
 *   - reservations
 *   - trade_in_quotes
 *
 * Two modes:
 *   1. By explicit ID list:
 *      body: { mode: "by-id", table: "leads", ids: ["uuid1", "uuid2"] }
 *
 *   2. By name/email pattern (matches typical test fixtures):
 *      body: { mode: "test-pattern", dryRun?: boolean }
 *      → matches rows whose customer_name OR customer_email matches one
 *        of the configured TEST_NAME_PATTERNS / TEST_EMAIL_PATTERNS.
 *
 * Defaults to dryRun=TRUE for safety: a caller must explicitly pass
 * dryRun:false to perform a destructive delete. This protects against
 * accidental data loss when the endpoint is invoked from a browser
 * console or curl one-liner.
 *
 * Response:
 *   200 (mode="by-id"):       { ok, mode, table, deleted }
 *   200 (mode="test-pattern", dryRun=true):  { ok, mode, dryRun:true, matches, summary }
 *   200 (mode="test-pattern", dryRun=false): { ok, mode, dryRun:false, deleted, errors? }
 *   400: invalid body
 *   401: not admin
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import {
  requireAdmin,
  parseJsonBody,
  validateStringArray,
} from "@/lib/security/admin-route-helpers"

export const dynamic = "force-dynamic"

// ── Types ─────────────────────────────────────────────────────────

type CleanableTable = "leads" | "reservations" | "trade_in_quotes"

interface ByIdBody {
  mode: "by-id"
  table: CleanableTable
  ids: string[]
}

interface PatternBody {
  mode: "test-pattern"
  dryRun: boolean
}

type CleanupBody = ByIdBody | PatternBody

interface PatternMatch {
  id: string
  customer_name?: string | null
  customer_email?: string | null
}

type PatternResults = Record<CleanableTable, PatternMatch[]>

type AdminClient = ReturnType<typeof createAdminClient>

// ── Constants ─────────────────────────────────────────────────────

const CLEANABLE_TABLES: readonly CleanableTable[] = [
  "leads",
  "reservations",
  "trade_in_quotes",
] as const

const TEST_NAME_PATTERNS = [
  "Devin Test",
  "Devin",
  "Toni Sultzberg",
  "Thigg Egg",
  "Thigg",
  "Egg",
] as const

const TEST_EMAIL_PATTERNS = [
  "%test%@%",
  "%@example.com",
  "devin%@%",
  "thigg%@%",
] as const

const MAX_IDS_PER_CALL = 100

// ── Body validation ───────────────────────────────────────────────

function isCleanableTable(value: unknown): value is CleanableTable {
  return (
    typeof value === "string" &&
    CLEANABLE_TABLES.includes(value as CleanableTable)
  )
}

function parseByIdBody(
  raw: Record<string, unknown>,
): { ok: true; body: ByIdBody } | { ok: false; error: string } {
  if (!isCleanableTable(raw.table)) {
    return {
      ok: false,
      error: `table must be one of ${CLEANABLE_TABLES.join("|")}`,
    }
  }
  const ids = validateStringArray(raw.ids, {
    minLength: 1,
    maxLength: MAX_IDS_PER_CALL,
  })
  if (!ids.ok) {
    const message =
      ids.code === "too-long"
        ? `Max ${MAX_IDS_PER_CALL} ids per call`
        : ids.code === "non-string"
          ? "ids must be strings"
          : "ids[] required and non-empty"
    return { ok: false, error: message }
  }
  return {
    ok: true,
    body: { mode: "by-id", table: raw.table, ids: ids.values },
  }
}

function parsePatternBody(
  raw: Record<string, unknown>,
): { ok: true; body: PatternBody } | { ok: false; error: string } {
  if ("dryRun" in raw && typeof raw.dryRun !== "boolean") {
    return { ok: false, error: "dryRun must be a boolean when provided" }
  }
  // Default to dryRun=TRUE (safe). Caller must pass dryRun:false to delete.
  const dryRun = raw.dryRun !== false
  return { ok: true, body: { mode: "test-pattern", dryRun } }
}

function parseBody(
  raw: unknown,
): { ok: true; body: CleanupBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Body must be an object" }
  }
  const c = raw as Record<string, unknown>
  if (c.mode === "by-id") return parseByIdBody(c)
  if (c.mode === "test-pattern") return parsePatternBody(c)
  return { ok: false, error: 'mode must be "by-id" or "test-pattern"' }
}

// ── Pattern matching (DB reads) ───────────────────────────────────

function buildOrFilter(): string {
  const nameOrFilter = TEST_NAME_PATTERNS.map(
    (p) => `customer_name.ilike.${p}%`,
  ).join(",")
  const emailOrFilter = TEST_EMAIL_PATTERNS.map(
    (p) => `customer_email.ilike.${p}`,
  ).join(",")
  return `${nameOrFilter},${emailOrFilter}`
}

async function fetchPatternMatches(
  supabase: AdminClient,
  table: CleanableTable,
  orFilter: string,
): Promise<PatternMatch[]> {
  const { data, error } = await supabase
    .from(table)
    .select("id, customer_name, customer_email")
    .or(orFilter)
  if (error) {
    logger.warn("[cleanup] pattern fetch error", { table, error: error.message })
    return []
  }
  return (data ?? []) as PatternMatch[]
}

async function findTestRows(supabase: AdminClient): Promise<PatternResults> {
  const orFilter = buildOrFilter()
  const [leads, reservations, trade_in_quotes] = await Promise.all(
    CLEANABLE_TABLES.map((t) => fetchPatternMatches(supabase, t, orFilter)),
  )
  return { leads, reservations, trade_in_quotes }
}

// ── Deletion (DB writes) ──────────────────────────────────────────

async function deleteByIds(
  supabase: AdminClient,
  table: CleanableTable,
  ids: string[],
): Promise<number> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .in("id", ids)
  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

interface DeleteAllResult {
  deleted: Record<CleanableTable, number>
  errors: string[]
}

async function deleteAllMatches(
  supabase: AdminClient,
  matches: PatternResults,
): Promise<DeleteAllResult> {
  const deleted: Record<CleanableTable, number> = {
    leads: 0,
    reservations: 0,
    trade_in_quotes: 0,
  }
  const errors: string[] = []

  for (const table of CLEANABLE_TABLES) {
    const ids = matches[table].map((row) => row.id)
    if (ids.length === 0) continue
    try {
      deleted[table] = await deleteByIds(supabase, table, ids)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown delete error"
      errors.push(msg)
      logger.error("[cleanup] delete error", { table, error: msg })
    }
  }

  return { deleted, errors }
}

// ── Response builders ─────────────────────────────────────────────

function summarise(matches: PatternResults): Record<CleanableTable, number> {
  return {
    leads: matches.leads.length,
    reservations: matches.reservations.length,
    trade_in_quotes: matches.trade_in_quotes.length,
  }
}

// ── POST handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, parseBody)
  if (!parsed.ok) return parsed.response

  const supabase = createAdminClient()

  if (parsed.body.mode === "by-id") {
    const { table, ids } = parsed.body
    try {
      const deleted = await deleteByIds(supabase, table, ids)
      logger.info("[cleanup] by-id delete", {
        admin: auth.email,
        table,
        idsCount: ids.length,
        deleted,
      })
      return NextResponse.json({ ok: true, mode: "by-id", table, deleted })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed"
      logger.error("[cleanup] by-id delete error", {
        admin: auth.email,
        table,
        error: msg,
      })
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // mode: test-pattern
  const matches = await findTestRows(supabase)

  if (parsed.body.dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "test-pattern",
      dryRun: true,
      matches,
      summary: summarise(matches),
    })
  }

  const { deleted, errors } = await deleteAllMatches(supabase, matches)
  logger.info("[cleanup] test-pattern delete", {
    admin: auth.email,
    deleted,
    errorCount: errors.length,
  })

  return NextResponse.json({
    ok: errors.length === 0,
    mode: "test-pattern",
    dryRun: false,
    deleted,
    ...(errors.length > 0 ? { errors } : {}),
  })
}
