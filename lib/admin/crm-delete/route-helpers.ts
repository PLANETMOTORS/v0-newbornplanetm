/**
 * Shared NextResponse mappers + UUID param parser for the per-table
 * CRM delete routes.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { logger } from "@/lib/logger"
import { deleteCrmRow, type CrmDeleteError, type CrmTable } from "./repository"

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
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const idOrResp = await parseIdParam(ctx.params)
    if (typeof idOrResp !== "string") return idOrResp

    const result = await deleteCrmRow(table, idOrResp)
    if (!result.ok) return crmDeleteErrorToResponse(result.error, table)

    logger.info("[admin-crm-delete] row removed", {
      table,
      by: auth.value.email,
      id: idOrResp,
    })
    return NextResponse.json({ deletedId: result.value.id })
  }
}
