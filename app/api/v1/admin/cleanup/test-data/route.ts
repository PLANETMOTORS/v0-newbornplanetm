/**
 * POST /api/v1/admin/cleanup/test-data
 *
 * One-shot ops endpoint to delete test rows that accumulated during
 * pre-launch QA. Targets the four tables most polluted by test sessions:
 *   - leads
 *   - reservations
 *   - trade_in_quotes
 *   - finance_application_drafts (if present)
 *
 * Two modes:
 *   1. By explicit ID list:
 *      body: { table: "leads", ids: ["uuid1", "uuid2"] }
 *
 *   2. By name/email pattern (matches typical test fixtures):
 *      body: { mode: "test-pattern", dryRun?: boolean }
 *      → deletes anything whose customer_name OR email matches:
 *          - "Devin*"  (Devin Test, devin.test@...)
 *          - "Toni Sultzberg" (developer's seed account)
 *          - "Thigg Egg"
 *          - "aaa*"
 *          - "*test*@*"
 *
 * dryRun=true returns the matching rows without deleting — safer first step.
 *
 * Response:
 *   200: { ok, deleted: { leads: N, reservations: N, ... }, byTable: {...} }
 *   400: invalid body
 *   401: not admin
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

export const dynamic = "force-dynamic"

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

interface ByIdBody {
  mode: "by-id"
  table: "leads" | "reservations" | "trade_in_quotes"
  ids: string[]
}
interface PatternBody {
  mode: "test-pattern"
  dryRun?: boolean
}

type CleanupBody = ByIdBody | PatternBody

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

function parseBody(raw: unknown): { ok: true; body: CleanupBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object" }
  const c = raw as Record<string, unknown>

  if (c.mode === "by-id") {
    const allowed = ["leads", "reservations", "trade_in_quotes"]
    if (typeof c.table !== "string" || !allowed.includes(c.table)) {
      return { ok: false, error: `table must be one of ${allowed.join("|")}` }
    }
    if (!Array.isArray(c.ids) || c.ids.length === 0) {
      return { ok: false, error: "ids[] required and non-empty" }
    }
    if (c.ids.length > 100) return { ok: false, error: "Max 100 ids per call" }
    for (const id of c.ids) {
      if (typeof id !== "string") return { ok: false, error: "ids must be strings" }
    }
    return {
      ok: true,
      body: {
        mode: "by-id",
        table: c.table as ByIdBody["table"],
        ids: c.ids as string[],
      },
    }
  }

  if (c.mode === "test-pattern") {
    return {
      ok: true,
      body: {
        mode: "test-pattern",
        dryRun: c.dryRun === true,
      },
    }
  }

  return { ok: false, error: 'mode must be "by-id" or "test-pattern"' }
}

interface PatternMatch {
  id: string
  customer_name?: string | null
  customer_email?: string | null
}

interface PatternResults {
  leads: PatternMatch[]
  reservations: PatternMatch[]
  trade_in_quotes: PatternMatch[]
}

async function findTestRows(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<PatternResults> {
  const result: PatternResults = { leads: [], reservations: [], trade_in_quotes: [] }

  // Build OR-pattern filter strings for Postgrest. ilike supports % wildcard.
  const nameOrFilter = TEST_NAME_PATTERNS.map(
    (p) => `customer_name.ilike.${p}%`,
  ).join(",")
  const emailOrFilter = TEST_EMAIL_PATTERNS.map(
    (p) => `customer_email.ilike.${p}`,
  ).join(",")
  const combined = `${nameOrFilter},${emailOrFilter}`

  const { data: leads } = await supabase
    .from("leads")
    .select("id, customer_name, customer_email")
    .or(combined)
  result.leads = (leads ?? []) as PatternMatch[]

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, customer_name, customer_email")
    .or(combined)
  result.reservations = (reservations ?? []) as PatternMatch[]

  const { data: tradeIns } = await supabase
    .from("trade_in_quotes")
    .select("id, customer_name, customer_email")
    .or(combined)
  result.trade_in_quotes = (tradeIns ?? []) as PatternMatch[]

  return result
}

async function deleteByIds(
  supabase: ReturnType<typeof createAdminClient>,
  table: "leads" | "reservations" | "trade_in_quotes",
  ids: string[],
): Promise<number> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .in("id", ids)
  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const unauthorised = await authoriseAdminOrError()
  if (unauthorised) return unauthorised

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 })
  }

  const parsed = parseBody(json)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const supabase = createAdminClient()

  if (parsed.body.mode === "by-id") {
    try {
      const deleted = await deleteByIds(supabase, parsed.body.table, parsed.body.ids)
      return NextResponse.json({
        ok: true,
        mode: "by-id",
        table: parsed.body.table,
        deleted,
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Delete failed" },
        { status: 500 },
      )
    }
  }

  // test-pattern mode
  const matches = await findTestRows(supabase)
  if (parsed.body.dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "test-pattern",
      dryRun: true,
      matches,
      summary: {
        leads: matches.leads.length,
        reservations: matches.reservations.length,
        trade_in_quotes: matches.trade_in_quotes.length,
      },
    })
  }

  const deletedCounts = { leads: 0, reservations: 0, trade_in_quotes: 0 }
  const errors: string[] = []

  for (const table of ["leads", "reservations", "trade_in_quotes"] as const) {
    const ids = matches[table].map((r) => r.id)
    if (ids.length === 0) continue
    try {
      deletedCounts[table] = await deleteByIds(supabase, table, ids)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown error")
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    mode: "test-pattern",
    dryRun: false,
    deleted: deletedCounts,
    errors: errors.length > 0 ? errors : undefined,
  })
}
