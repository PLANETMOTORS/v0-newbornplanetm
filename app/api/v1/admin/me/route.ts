/**
 * GET /api/v1/admin/me
 *
 * Returns whether the currently-authenticated user is an admin.
 *
 *   200 — { isAdmin: true,  email, role, source }
 *   200 — { isAdmin: false, email | null }   (gate-fail still 200; UI decides)
 *
 * The 200-on-not-admin response shape is intentional so the admin-shell
 * client can distinguish "not signed in" / "signed in but not admin" /
 * "admin" without parsing 4xx bodies.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"
import { getAdminByEmail } from "@/lib/admin/users/repository"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email ?? null
  if (!email) {
    return NextResponse.json({ isAdmin: false, email: null })
  }

  // Check DB for full admin row (includes role + custom permissions)
  const dbResult = await getAdminByEmail(email).catch(() => null)
  if (dbResult && dbResult.ok && dbResult.value?.is_active) {
    return NextResponse.json({
      isAdmin: true,
      email,
      role: dbResult.value.role,
      permissions: dbResult.value.permissions ?? null,
      source: "db" as const,
    })
  }

  if (ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({
      isAdmin: true,
      email,
      role: "admin" as const,
      permissions: null,
      source: "env" as const,
    })
  }

  return NextResponse.json({ isAdmin: false, email })
}
