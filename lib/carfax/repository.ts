/**
 * Persistence layer for the Carfax badge cache.
 *
 * The route handler is the only place that knows about staleness windows;
 * this module just exposes typed read/upsert primitives. Every fallible
 * boundary returns Result<T, CarfaxRepoError> so the route stays linear.
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
  readonly has_report: boolean
  readonly result_code: number
  readonly result_message: string
  readonly fetched_at: string
}

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "unknown error"
}

function dbError(message: string, code?: string): { kind: "db-error"; message: string; code?: string } {
  return code ? { kind: "db-error", message, code } : { kind: "db-error", message }
}

/**
 * Fetch the cached summary for a single VIN. Returns ok(null) when there
 * is no cache row (the VDP will then trigger a live fetch). Returns an
 * Err only on actual DB failure — "row missing" is the success path.
 */
export async function getCachedSummary(
  vin: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<CarfaxBadgeSummary | null, CarfaxRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from("carfax_cache")
      .select("vin, payload, has_report, result_code, result_message, fetched_at")
      .eq("vin", vin)
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    if (!data) return ok(null)
    return ok((data as CarfaxCacheRow).payload)
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

/**
 * UPSERT a fresh summary. The `fetched_at` field on the payload is the
 * authoritative timestamp; we mirror it onto the indexed column so a
 * "give me everything stale" query is fast.
 */
export async function upsertSummary(
  summary: CarfaxBadgeSummary,
  factory: ClientFactory = createAdminClient,
): Promise<Result<CarfaxBadgeSummary, CarfaxRepoError>> {
  try {
    const client = factory()
    const { error } = await client
      .from("carfax_cache")
      .upsert(
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
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

/**
 * Decide whether a cached row is fresh enough to skip a live fetch.
 * Default window: 24 h. Pure function so unit tests stay deterministic.
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
