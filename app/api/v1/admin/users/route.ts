/**
 * GET  /api/v1/admin/users  — list all admin users (active + inactive)
 * POST /api/v1/admin/users  — invite a new admin
 *
 * Both endpoints require requireAdmin() and use Zod-validated bodies.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  requireAdmin,
  requireFeatureAccess,
  parseJsonBody,
} from "@/lib/security/admin-route-helpers"
import {
  inviteAdminSchema,
  type InviteAdminRequest,
} from "@/lib/admin/users/schemas"
import {
  inviteAdmin,
  listAdmins,
  type AdminUserRepoError,
} from "@/lib/admin/users/repository"
import { logger } from "@/lib/logger"

function repoErrorToResponse(error: AdminUserRepoError): NextResponse {
  switch (error.kind) {
    case "duplicate-email":
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_EMAIL",
            message: `${error.email} is already an admin`,
          },
        },
        { status: 409 },
      )
    case "not-found":
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
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

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const forbidden = requireFeatureAccess(auth.value, "admin_users", "read")
  if (forbidden) return forbidden

  const result = await listAdmins()
  if (!result.ok) return repoErrorToResponse(result.error)
  return NextResponse.json({ admins: result.value })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error

  const forbidden = requireFeatureAccess(auth.value, "admin_users", "full")
  if (forbidden) return forbidden

  const parsed = await parseJsonBody<typeof inviteAdminSchema>(
    request,
    inviteAdminSchema,
  )
  if (!parsed.ok) return parsed.error

  const body: InviteAdminRequest = parsed.value
  const result = await inviteAdmin(body, null)
  if (!result.ok) return repoErrorToResponse(result.error)

  logger.info("[admin-users] invited", {
    invitedEmail: body.email,
    invitedBy: auth.value.email,
    role: body.role,
  })
  return NextResponse.json({ admin: result.value }, { status: 201 })
}
