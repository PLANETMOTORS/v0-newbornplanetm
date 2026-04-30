/**
 * Single source of truth for admin email addresses.
 *
 * Reads from the ADMIN_EMAILS environment variable (comma-separated) and
 * falls back to a hardcoded list when the variable is not set.
 *
 * Usage:
 *   import { ADMIN_EMAILS, isAdminEmail, authoriseAdminOrError } from "@/lib/admin"
 */

import { NextResponse } from "next/server"

export const ADMIN_EMAILS: readonly string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
  : ["admin@planetmotors.ca", "toni@planetmotors.ca"]

/** Check whether a given email address belongs to an admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

/**
 * Shared admin auth guard for API routes.
 * Returns a 401 NextResponse if the current user is not an admin, or null on success.
 */
export async function authoriseAdminOrError(): Promise<NextResponse | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
