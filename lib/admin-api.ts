/**
 * Shared helpers for admin API routes.
 *
 * Centralises the admin auth check, service-role client init, pagination
 * parsing, and search-string sanitization that every admin endpoint needs.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"

export type AdminClient = ReturnType<typeof createAdminClient>

export type AdminAuthSuccess = { ok: true; adminClient: AdminClient }
export type AdminAuthFailure = { ok: false; response: NextResponse }
export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure

/**
 * Authenticate the caller as an admin and return a service-role Supabase
 * client. Returns a typed discriminated union so callers can early-return
 * the failure response.
 */
export async function authenticateAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  let adminClient: AdminClient
  try {
    adminClient = createAdminClient()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin client not configured" },
        { status: 500 },
      ),
    }
  }

  return { ok: true, adminClient }
}

/**
 * Parse `limit` and `offset` query params with safe defaults and bounds.
 * `limit` is clamped to [1, 200], default 50. `offset` is clamped to >= 0.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { limit?: number; maxLimit?: number } = {},
): { limit: number; offset: number } {
  const defaultLimit = defaults.limit ?? 50
  const maxLimit = defaults.maxLimit ?? 200

  const rawLimit = Number.parseInt(searchParams.get("limit") || String(defaultLimit))
  const limit = Math.min(
    Math.max(1, Number.isNaN(rawLimit) ? defaultLimit : rawLimit),
    maxLimit,
  )

  const rawOffset = Number.parseInt(searchParams.get("offset") || "0")
  const offset = Math.max(0, Number.isNaN(rawOffset) ? 0 : rawOffset)

  return { limit, offset }
}

/**
 * Sanitize a free-text search query so it is safe to embed in PostgREST
 * `.or()` filters (which are comma- and parenthesis-delimited).
 *
 * - Strips characters outside the configured allow-list.
 * - Trims and caps length to 200 chars.
 *
 * @param input          Raw search string from the request.
 * @param options.allowEmail  Allow `@` and `.` characters (for email searches).
 */
export function sanitizeSearch(
  input: string,
  options: { allowEmail?: boolean } = {},
): string {
  const allowed = options.allowEmail
    ? /[^a-zA-Z0-9\s@.-]/gu
    : /[^a-zA-Z0-9\s-]/gu

  return input.trim().slice(0, 200).replaceAll(allowed, "").trim()
}

/**
 * Convenience: parse the request URL and return its query params.
 */
export function getSearchParams(request: NextRequest): URLSearchParams {
  return new URL(request.url).searchParams
}
