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
 * Reusable string-array validator for admin endpoints whose body
 * shape is "non-empty array of strings within bounds".
 *
 * Error codes (rather than fixed messages) let each caller render a
 * field-specific user-facing error without re-implementing the same
 * Array.isArray + length + element-type checks inline. That repetition
 * is what SonarCloud flags as duplicated code.
 */
export type StringArrayErrorCode =
  | "not-array"
  | "too-short"
  | "too-long"
  | "non-string"

export type StringArrayResult =
  | { ok: true; values: string[] }
  | { ok: false; code: StringArrayErrorCode; index?: number }

export interface StringArrayBounds {
  minLength?: number
  maxLength?: number
}

export function validateStringArray(
  value: unknown,
  bounds: StringArrayBounds = {},
): StringArrayResult {
  if (!Array.isArray(value)) {
    return { ok: false, code: "not-array" }
  }
  const min = bounds.minLength ?? 0
  const max = bounds.maxLength ?? Number.MAX_SAFE_INTEGER
  if (value.length < min) return { ok: false, code: "too-short" }
  if (value.length > max) return { ok: false, code: "too-long" }
  const badIndex = value.findIndex((item) => typeof item !== "string")
  if (badIndex !== -1) {
    return { ok: false, code: "non-string", index: badIndex }
  }
  return { ok: true, values: value as string[] }
}

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
