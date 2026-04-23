/**
 * Single source of truth for admin email addresses.
 *
 * Reads from the ADMIN_EMAILS environment variable (comma-separated) and
 * falls back to a hardcoded list when the variable is not set.
 *
 * Usage:
 *   import { ADMIN_EMAILS, isAdminEmail } from "@/lib/admin"
 */

export const ADMIN_EMAILS: readonly string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
  : ["admin@planetmotors.ca", "toni@planetmotors.ca"]

/** Check whether a given email address belongs to an admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
