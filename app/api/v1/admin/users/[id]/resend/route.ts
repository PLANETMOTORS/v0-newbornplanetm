/**
 * POST /api/v1/admin/users/[id]/resend — re-send the admin invitation email
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import { adminUserIdParamSchema } from "@/lib/admin/users/schemas"
import { getAdminById } from "@/lib/admin/users/repository"
import { sendAdminInvitationEmail } from "@/lib/email"
import { logger } from "@/lib/logger"

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(
  _request: NextRequest,
  ctx: Params,
): Promise<NextResponse> {
  const auth = await requirePermission("admin_users", "full")
  if (!auth.ok) return auth.error

  const raw = await ctx.params
  const parsed = adminUserIdParamSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid admin user id" }, { status: 400 })
  }
  const id = parsed.data.id

  const result = await getAdminById(id)
  if (!result.ok) {
    return NextResponse.json({ error: "Failed to look up user" }, { status: 500 })
  }
  if (!result.value) {
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
  }

  const admin = result.value

  const emailResult = await sendAdminInvitationEmail({
    email: admin.email,
    role: admin.role,
    invitedBy: auth.value.email,
    notes: admin.notes ?? undefined,
  })

  if (!emailResult.success) {
    logger.warn("[admin-users] resend invitation email failed", {
      targetId: id,
      email: admin.email,
      error: emailResult.error,
    })
    return NextResponse.json(
      { error: "Failed to send invitation email", detail: emailResult.error },
      { status: 502 },
    )
  }

  logger.info("[admin-users] invitation resent", {
    targetId: id,
    email: admin.email,
    by: auth.value.email,
  })

  return NextResponse.json({ ok: true, email: admin.email })
}
