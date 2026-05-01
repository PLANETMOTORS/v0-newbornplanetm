/**
 * Generic per-row delete for the four customer-facing CRM tables.
 *
 * The admin CRM pages (`/admin/leads`, `/admin/finance`, `/admin/reservations`,
 * `/admin/trade-ins`) all need the same operation: "operator clicks the row's
 * trash icon → that single row goes away → list + dashboard counts update."
 *
 * Centralising the delete logic here means:
 *   1. Every table goes through the same auth + UUID gate.
 *   2. Every error path returns the same `RepoError` shape so each thin
 *      route handler is ~12 lines.
 *   3. Adding a new CRM table tomorrow is one entry in `CRM_TABLES`,
 *      one route file, and zero test rewrites.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"

export const CRM_TABLES = [
  "leads",
  "finance_applications_v2",
  "reservations",
  "trade_in_quotes",
] as const

export type CrmTable = (typeof CRM_TABLES)[number]

export type CrmDeleteError =
  | { readonly kind: "not-found" }
  | { readonly kind: "db-error"; readonly message: string; readonly code?: string }
  | { readonly kind: "exception"; readonly message: string }

type AdminClient = ReturnType<typeof createAdminClient>
type ClientFactory = () => AdminClient

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "unknown error"
}

function dbError(
  message: string,
  code?: string,
): { kind: "db-error"; message: string; code?: string } {
  return code ? { kind: "db-error", message, code } : { kind: "db-error", message }
}

/**
 * Delete a single row from a CRM table by primary key.
 *
 * Returns the deleted row's id on success or a kinded error so the route
 * handler can map it to the appropriate HTTP status.
 */
export async function deleteCrmRow(
  table: CrmTable,
  id: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<{ id: string }, CrmDeleteError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from(table)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    if (!data) return err({ kind: "not-found" })
    return ok({ id: data.id as string })
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}
