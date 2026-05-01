/**
 * Shared NextResponse mappers + UUID param parser for the per-table
 * CRM delete routes.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import type { CrmDeleteError, CrmTable } from "./repository"

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
