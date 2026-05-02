/**
 * POST /api/v1/admin/cleanup/test-data
 *
 * Admin-only ops endpoint that deletes rows polluted by pre-launch QA in
 * the leads / reservations / trade_in_quotes tables.
 *
 * Two operating modes share a discriminated-union body — the schema lives
 * in `lib/admin/cleanup/schemas.ts`:
 *
 *   - { mode: "by-id", table, ids[] }
 *       Delete a specific list of UUIDs from one table.
 *
 *   - { mode: "test-pattern", dryRun?: boolean }
 *       Match rows whose name/email matches a known QA fixture across
 *       every cleanable table. `dryRun=true` (the default) returns the
 *       matches without deleting anything; `dryRun=false` deletes them.
 *
 * The default-true `dryRun` is the kill-switch: a caller invoking this
 * from a browser console or curl one-liner cannot accidentally wipe data.
 *
 * Responses (always 200 unless gate fails):
 *   200 — by-id success                {ok, mode, table, deleted}
 *   200 — test-pattern dry run         {ok, mode, dryRun:true, matches, summary}
 *   200 — test-pattern destructive run {ok, mode, dryRun:false, deleted, errors?}
 *   400 — invalid body / JSON
 *   401 — caller not in ADMIN_EMAILS
 *   500 — by-id delete blew up        {error}
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import {
  parseJsonBody,
  requireAdmin,
} from "@/lib/security/admin-route-helpers"
import {
  cleanupBodySchema,
  type CleanupBody,
  type CleanupByIdBody,
  type CleanupTestPatternBody,
} from "@/lib/admin/cleanup/schemas"
import {
  deleteAllMatches,
  deleteByIds,
  findTestRows,
  summarise,
} from "@/lib/admin/cleanup/repository"

export const dynamic = "force-dynamic"

async function handleByIdMode(
  body: CleanupByIdBody,
  adminEmail: string,
): Promise<NextResponse> {
  const result = await deleteByIds(body.table, body.ids)
  if (!result.ok) {
    logger.error("[cleanup] by-id delete error", {
      admin: adminEmail,
      table: body.table,
      error: result.error,
    })
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  logger.info("[cleanup] by-id delete", {
    admin: adminEmail,
    table: body.table,
    idsCount: body.ids.length,
    deleted: result.value,
  })
  return NextResponse.json({
    ok: true,
    mode: "by-id" as const,
    table: body.table,
    deleted: result.value,
  })
}

async function handleTestPatternMode(
  body: CleanupTestPatternBody,
  adminEmail: string,
): Promise<NextResponse> {
  const matches = await findTestRows()

  if (body.dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "test-pattern" as const,
      dryRun: true as const,
      matches,
      summary: summarise(matches),
    })
  }

  const { deleted, errors } = await deleteAllMatches(matches)
  logger.info("[cleanup] test-pattern delete", {
    admin: adminEmail,
    deleted,
    errorCount: errors.length,
  })

  return NextResponse.json({
    ok: errors.length === 0,
    mode: "test-pattern" as const,
    dryRun: false as const,
    deleted,
    ...(errors.length > 0 ? { errors } : {}),
  })
}

function dispatch(
  body: CleanupBody,
  adminEmail: string,
): Promise<NextResponse> {
  return body.mode === "by-id"
    ? handleByIdMode(body, adminEmail)
    : handleTestPatternMode(body, adminEmail)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const parsed = await parseJsonBody(request, cleanupBodySchema)
  if (!parsed.ok) return parsed.error

  return dispatch(parsed.value, auth.value.email)
}
