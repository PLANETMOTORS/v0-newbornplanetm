/**
 * GET  /api/v1/admin/users  — list all admin users (active + inactive)
 * POST /api/v1/admin/users  — invite a new admin
 *
 * Both endpoints require requireAdmin() and use Zod-validated bodies.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  requirePermission,
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
import { sendAdminInvitationEmail } from "@/lib/email"

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
  // Listing admins is read-only but still privileged — managers/viewers
  // need at least "read" on the admin_users feature; viewers in the
  // default preset have "none" so they're rejected here.
  const auth = await requirePermission("admin_users", "read")
  if (!auth.ok) return auth.error

  const result = await listAdmins()
  if (!result.ok) return repoErrorToResponse(result.error)
  return NextResponse.json({ admins: result.value })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Inviting a new admin is a destructive operation on the admin roster.
  // Hard-gated to "full" admin_users access so managers cannot escalate
  // their own org by inviting accomplices.
  const auth = await requirePermission("admin_users", "full")
  if (!auth.ok) return auth.error

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
    invitedByRole: auth.value.role,
    role: body.role,
  })

  // Send invitation email (fire-and-forget — don't block the response)
  const emailResult = await sendAdminInvitationEmail({
    email: body.email,
    role: body.role,
    invitedBy: auth.value.email,
    notes: body.notes,
  })

  if (!emailResult.success) {
    logger.warn("[admin-users] invitation email failed", {
      email: body.email,
      error: emailResult.error,
    })
  }

  return NextResponse.json(
    { admin: result.value, emailSent: emailResult.success },
    { status: 201 },
  )
}
