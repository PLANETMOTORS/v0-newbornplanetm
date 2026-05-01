/**
 * DELETE /api/v1/admin/trade-ins/[id] — admin removes a trade-in quote.
 *
 * Note: the existing `[id]/status/route.ts` (PATCH) sits alongside this
 * file; both share the same /trade-ins/[id] segment.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { deleteCrmRow } from "@/lib/admin/crm-delete/repository"
import {
  crmDeleteErrorToResponse,
  parseIdParam,
} from "@/lib/admin/crm-delete/route-helpers"
import { logger } from "@/lib/logger"

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(
  _request: NextRequest,
  ctx: Params,
): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const idOrResp = await parseIdParam(ctx.params)
  if (typeof idOrResp !== "string") return idOrResp

  const result = await deleteCrmRow("trade_in_quotes", idOrResp)
  if (!result.ok)
    return crmDeleteErrorToResponse(result.error, "trade_in_quotes")

  logger.info("[admin-crm-delete] trade-in removed", {
    by: auth.value.email,
    id: idOrResp,
  })
  return NextResponse.json({ deletedId: result.value.id })
}
