/**
 * Shared NextResponse mappers + UUID param parser for the per-table
 * CRM delete routes.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import type { AdminFeature } from "@/lib/admin/permissions"
import { logger } from "@/lib/logger"
import { deleteCrmRow, type CrmDeleteError, type CrmTable } from "./repository"

/**
 * Map each CRM table to the admin-permissions feature key that gates it.
 * Destructive ops (delete) require the matching feature at "full" level —
 * a manager/viewer with read-only access on a feature can no longer call
 * DELETE on its rows by hitting the API directly.
 */
const TABLE_TO_FEATURE: Record<CrmTable, AdminFeature> = {
  leads: "leads",
  finance_applications_v2: "finance_apps",
  reservations: "reservations",
  trade_in_quotes: "leads",
}

export const idParamSchema = z
  .object({ id: z.string().uuid("id must be a uuid") })
  .strict()

export function crmDeleteErrorToResponse(
  error: CrmDeleteError,
  table: CrmTable,
): NextResponse {
  switch (error.kind) {
    case "not-found":
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `${table} row not found` } },
        { status: 404 },
      )
    case "db-error":
    case "exception":
      logger.error("[admin-crm-delete] failure", {
        table,
        kind: error.kind,
        message: error.message,
      })
      return NextResponse.json(
        { error: { code: "CRM_DELETE_FAILED", message: error.message } },
        { status: 500 },
      )
  }
}

export async function parseIdParam(
  rawParams: Promise<{ id: string }>,
): Promise<NextResponse | string> {
  const raw = await rawParams
  const parsed = idParamSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "id must be a uuid" } },
      { status: 400 },
    )
  }
  return parsed.data.id
}

/**
 * Shared DELETE handler factory for the CRM tables. Each route file
 * just calls `createCrmDeleteHandler("leads")` and re-exports the
 * resulting function as `DELETE`. Keeps every endpoint identical so
 * Sonar's duplicate-line detector stays happy and so adding a fifth
 * CRM table is a one-line change.
 */
export function createCrmDeleteHandler(table: CrmTable) {
  return async function DELETE(
    _request: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> {
    // Destructive ops require "full" access on the feature that owns
    // this table; viewers / read-only managers receive 403.
    const auth = await requirePermission(TABLE_TO_FEATURE[table], "full")
    if (!auth.ok) return auth.error

    const idOrResp = await parseIdParam(ctx.params)
    if (typeof idOrResp !== "string") return idOrResp

    const result = await deleteCrmRow(table, idOrResp)
    if (!result.ok) return crmDeleteErrorToResponse(result.error, table)

    logger.info("[admin-crm-delete] row removed", {
      table,
      by: auth.value.email,
      role: auth.value.role,
      id: idOrResp,
    })
    return NextResponse.json({ deletedId: result.value.id })
  }
}
