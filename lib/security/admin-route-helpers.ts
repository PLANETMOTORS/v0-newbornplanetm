/**
 * Shared helpers for admin operator endpoints.
 *
 * Every admin POST route at /api/v1/admin/** needs the same three
 * gates before doing real work:
 *   1. Verify the caller is in ADMIN_EMAILS (returns 401 otherwise).
 *   2. Parse the JSON body (returns 400 on parse failure).
 *   3. Validate the parsed body against a per-route schema.
 *
 * Without this module each route re-implements gates 1+2 verbatim,
 * which SonarCloud rightly flags as duplication on new code.
 *
 * Usage:
 *
 *     export async function POST(request: NextRequest) {
 *       const auth = await requireAdmin()
 *       if (!auth.ok) return auth.response
 *
 *       const parsed = await parseJsonBody(request, myValidator)
 *       if (!parsed.ok) return parsed.response
 *
 *       // … route-specific logic, has access to auth.email + parsed.body
 *     }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

export type AuthOk = { ok: true; email: string }
export type AuthFail = { ok: false; response: NextResponse }
export type AuthResult = AuthOk | AuthFail

/**
 * Resolve the current Supabase user and gate by ADMIN_EMAILS.
 * Returns either the authenticated admin email or a 401 response.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  const email = user?.email
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, email }
}

export type BodyOk<T> = { ok: true; body: T }
export type BodyFail = { ok: false; response: NextResponse }
export type BodyResult<T> = BodyOk<T> | BodyFail

export type BodyValidator<T> =
  | ((raw: unknown) => { ok: true; body: T } | { ok: false; error: string })
  | ((raw: unknown) => Promise<{ ok: true; body: T } | { ok: false; error: string }>)

/**
 * Parse JSON from the request and run it through the supplied
 * validator. Returns 400 with a clear error on parse failure or
 * validation failure.
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  validate: BodyValidator<T>,
): Promise<BodyResult<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Body must be valid JSON" },
        { status: 400 },
      ),
    }
  }
  const result = await validate(raw)
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: result.error }, { status: 400 }),
    }
  }
  return { ok: true, body: result.body }
}
