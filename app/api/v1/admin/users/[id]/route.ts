/**
 * PATCH  /api/v1/admin/users/[id]  — change role / activate / notes
 * DELETE /api/v1/admin/users/[id]  — hard delete the row
 *
 * Self-protection: an admin cannot deactivate or delete themselves —
 * we want to keep at least one operating admin online.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  requireAdmin,
  requireFeatureAccess,
  parseJsonBody,
} from "@/lib/security/admin-route-helpers"
import {
  updateAdminSchema,
  adminUserIdParamSchema,
} from "@/lib/admin/users/schemas"
import {
  deleteAdmin,
  getAdminByEmail,
  updateAdmin,
  type AdminUserRepoError,
} from "@/lib/admin/users/repository"
import { logger } from "@/lib/logger"

function repoErrorToResponse(error: AdminUserRepoError): NextResponse {
  switch (error.kind) {
    case "not-found":
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    case "duplicate-email":
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      )
    case "db-error":
    case "exception":
      logger.error("[admin-users] repo failure", {
        kind: error.kind,
        message: error.message,
      })
      return NextResponse.json(
        { error: { code: "ADMIN_USER_PERSIST_FAILED", message: error.message } },
        { status: 500 },
      )
  }
}

interface Params {
  params: Promise<{ id: string }>
}

async function resolveId(params: Params["params"]): Promise<NextResponse | string> {
  const raw = await params
  const parsed = adminUserIdParamSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid admin user id" }, { status: 400 })
  }
  return parsed.data.id
}

async function selfProtect(
  id: string,
  callerEmail: string,
): Promise<NextResponse | null> {
  const result = await getAdminByEmail(callerEmail)
  if (result.ok && result.value?.id === id) {
    return NextResponse.json(
      {
        error: {
          code: "SELF_DEMOTION_FORBIDDEN",
          message:
            "You cannot deactivate or delete your own admin account. Ask another admin.",
        },
      },
      { status: 409 },
    )
  }
  return null
}

export async function PATCH(
  request: NextRequest,
  ctx: Params,
): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const forbidden = requireFeatureAccess(auth.value, "admin_users", "full")
  if (forbidden) return forbidden

  const idOrErr = await resolveId(ctx.params)
  if (typeof idOrErr !== "string") return idOrErr
  const id = idOrErr

  const parsed = await parseJsonBody<typeof updateAdminSchema>(
    request,
    updateAdminSchema,
  )
  if (!parsed.ok) return parsed.error

  if (parsed.value.is_active === false || parsed.value.role === "viewer" || parsed.value.permissions !== undefined) {
    const blocked = await selfProtect(id, auth.value.email)
    if (blocked) return blocked
  }

  const result = await updateAdmin(id, parsed.value)
  if (!result.ok) return repoErrorToResponse(result.error)
  logger.info("[admin-users] updated", {
    targetId: id,
    by: auth.value.email,
    patch: parsed.value,
  })
  return NextResponse.json({ admin: result.value })
}

export async function DELETE(
  _request: NextRequest,
  ctx: Params,
): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const forbidden = requireFeatureAccess(auth.value, "admin_users", "full")
  if (forbidden) return forbidden

  const idOrErr = await resolveId(ctx.params)
  if (typeof idOrErr !== "string") return idOrErr
  const id = idOrErr

  const blocked = await selfProtect(id, auth.value.email)
  if (blocked) return blocked

  const result = await deleteAdmin(id)
  if (!result.ok) return repoErrorToResponse(result.error)
  logger.info("[admin-users] deleted", { targetId: id, by: auth.value.email })
  return NextResponse.json({ deletedId: result.value.id })
}
