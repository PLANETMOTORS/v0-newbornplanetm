/**
 * Server-only admin auth guard for API routes.
 *
 * Separated from lib/admin.ts to avoid pulling next/headers into
 * client component boundaries (app/admin/layout.tsx imports lib/admin).
 *
 * Usage:
 *   import { authoriseAdminOrError } from "@/lib/admin-auth"
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

/**
 * Returns a 401 NextResponse if the current user is not an admin, or null on success.
 */
export async function authoriseAdminOrError(): Promise<NextResponse | null> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
