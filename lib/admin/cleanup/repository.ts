/**
 * Data-access layer for the admin test-data cleanup endpoint.
 *
 * The route handler depends on this module's narrow surface — it does not
 * import the Supabase client directly. Each function returns a `Result`
 * so the handler can map failures to structured 500s without try/catch.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import {
  CLEANABLE_TABLES,
  TEST_EMAIL_PATTERNS,
  TEST_NAME_PATTERNS,
  type CleanableTable,
} from "./schemas"

export interface PatternMatch {
  readonly id: string
  readonly customer_name?: string | null
  readonly customer_email?: string | null
}

export type PatternResults = Record<CleanableTable, readonly PatternMatch[]>

export interface DeleteAllResult {
  readonly deleted: Record<CleanableTable, number>
  readonly errors: readonly string[]
}

type AdminClient = ReturnType<typeof createAdminClient>
type ClientFactory = () => AdminClient

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
): Promise<readonly PatternMatch[]> {
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

/**
 * Run the test-pattern SELECTs across every cleanable table in parallel.
 * Errors on any single table degrade gracefully to an empty match set so
 * the operator always sees the rest of the result.
 */
export async function findTestRows(
  clientFactory: ClientFactory = createAdminClient,
): Promise<PatternResults> {
  const supabase = clientFactory()
  const orFilter = buildOrFilter()
  const [leads, reservations, trade_in_quotes] = await Promise.all(
    CLEANABLE_TABLES.map((t) => fetchPatternMatches(supabase, t, orFilter)),
  )
  return { leads, reservations, trade_in_quotes }
}

/**
 * Delete a list of ids from a single table. Returns the row count or a
 * descriptive error string.
 */
export async function deleteByIds(
  table: CleanableTable,
  ids: readonly string[],
  clientFactory: ClientFactory = createAdminClient,
): Promise<Result<number, string>> {
  if (ids.length === 0) return ok(0)
  const supabase = clientFactory()
  try {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .in("id", ids as string[])
    if (error) return err(`${table}: ${error.message}`)
    return ok(count ?? 0)
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "delete threw"
    return err(`${table}: ${message}`)
  }
}

/**
 * Delete every matched row from every cleanable table. One table failing
 * does not stop the others — the operator gets a complete picture.
 */
export async function deleteAllMatches(
  matches: PatternResults,
  clientFactory: ClientFactory = createAdminClient,
): Promise<DeleteAllResult> {
  const deleted: Record<CleanableTable, number> = {
    leads: 0,
    reservations: 0,
    trade_in_quotes: 0,
  }
  const errors: string[] = []

  for (const table of CLEANABLE_TABLES) {
    const ids = matches[table].map((row) => row.id)
    const r = await deleteByIds(table, ids, clientFactory)
    if (r.ok) {
      deleted[table] = r.value
    } else {
      errors.push(r.error)
      logger.error("[cleanup] delete error", { table, error: r.error })
    }
  }

  return { deleted, errors }
}

/** Compute a `{ table → match-count }` summary from a pattern result set. */
export function summarise(matches: PatternResults): Record<CleanableTable, number> {
  return {
    leads: matches.leads.length,
    reservations: matches.reservations.length,
    trade_in_quotes: matches.trade_in_quotes.length,
  }
}
