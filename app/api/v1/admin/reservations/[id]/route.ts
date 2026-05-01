/**
 * DELETE /api/v1/admin/reservations/[id] — admin removes a reservation.
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

  const result = await deleteCrmRow("reservations", idOrResp)
  if (!result.ok) return crmDeleteErrorToResponse(result.error, "reservations")

  logger.info("[admin-crm-delete] reservation removed", {
    by: auth.value.email,
    id: idOrResp,
  })
  return NextResponse.json({ deletedId: result.value.id })
}
