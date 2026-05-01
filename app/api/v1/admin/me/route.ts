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
import { isActiveAdmin } from "@/lib/admin/users/repository"

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

  const dbActive = await isActiveAdmin(email).catch(() => false)
  if (dbActive) {
    return NextResponse.json({
      isAdmin: true,
      email,
      role: "admin" as const,
      source: "db" as const,
    })
  }

  if (ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({
      isAdmin: true,
      email,
      role: "admin" as const,
      source: "env" as const,
    })
  }

  return NextResponse.json({ isAdmin: false, email })
}
