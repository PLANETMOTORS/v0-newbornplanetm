/**
 * Persistence layer for the Carfax badge cache. The route handler is the
 * only place that knows the staleness window; this module exposes typed
 * read/upsert/freshness primitives so the route stays linear.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Result } from "@/lib/result"
import { err, ok } from "@/lib/result"
import type { CarfaxBadgeSummary } from "./schemas"

export type CarfaxRepoError =
  | { readonly kind: "db-error"; readonly message: string; readonly code?: string }
  | { readonly kind: "exception"; readonly message: string }

type AdminClient = ReturnType<typeof createAdminClient>
type ClientFactory = () => AdminClient

interface CarfaxCacheRow {
  readonly vin: string
  readonly payload: CarfaxBadgeSummary
}

const TABLE = "carfax_cache"
const SELECT = "vin, payload, has_report, result_code, result_message, fetched_at"

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "unknown error"
}

function dbError(message: string, code?: string): CarfaxRepoError {
  return code ? { kind: "db-error", message, code } : { kind: "db-error", message }
}

/** Fetch the cached summary for a single VIN. ok(null) means "no row". */
export async function getCachedSummary(
  vin: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<CarfaxBadgeSummary | null, CarfaxRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from(TABLE)
      .select(SELECT)
      .eq("vin", vin)
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    if (!data) return ok(null)
    return ok((data as CarfaxCacheRow).payload)
  } catch (e) {
    return err({ kind: "exception", message: describe(e) })
  }
}

/** UPSERT a fresh summary keyed by VIN. */
export async function upsertSummary(
  summary: CarfaxBadgeSummary,
  factory: ClientFactory = createAdminClient,
): Promise<Result<CarfaxBadgeSummary, CarfaxRepoError>> {
  try {
    const client = factory()
    const { error } = await client.from(TABLE).upsert(
      {
        vin: summary.vin,
        payload: summary,
        has_report: summary.hasReport,
        result_code: summary.resultCode,
        result_message: summary.resultMessage,
        fetched_at: summary.fetchedAt,
      },
      { onConflict: "vin" },
    )
    if (error) return err(dbError(error.message, error.code))
    return ok(summary)
  } catch (e) {
    return err({ kind: "exception", message: describe(e) })
  }
}

/**
 * Pure freshness check. Default window: 24 h.
 * Returns false on unparseable timestamps so a corrupt row triggers a
 * live refresh rather than silently serving stale data.
 */
export function isCacheFresh(
  summary: CarfaxBadgeSummary,
  nowMs: number,
  ttlMs: number = 24 * 60 * 60 * 1_000,
): boolean {
  const fetchedMs = Date.parse(summary.fetchedAt)
  if (Number.isNaN(fetchedMs)) return false
  return nowMs - fetchedMs < ttlMs
}
