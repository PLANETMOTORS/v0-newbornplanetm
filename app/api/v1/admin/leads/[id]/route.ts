/**
 * DELETE /api/v1/admin/leads/[id] — admin removes a single lead row.
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

  const result = await deleteCrmRow("leads", idOrResp)
  if (!result.ok) return crmDeleteErrorToResponse(result.error, "leads")

  logger.info("[admin-crm-delete] leads row removed", {
    by: auth.value.email,
    id: idOrResp,
  })
  return NextResponse.json({ deletedId: result.value.id })
}
