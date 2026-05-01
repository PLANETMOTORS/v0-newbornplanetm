/**
 * Shared helpers for admin operator endpoints.
 *
 * Every admin POST route at /api/v1/admin/** funnels through the same
 * three gates before doing real work:
 *
 *   1. `requireAdmin()`            — verifies the caller is in ADMIN_EMAILS
 *   2. `parseJsonBody(req, schema)` — parses + Zod-validates the body
 *   3. route-specific logic
 *
 * Without this module each route re-implements gates 1 + 2 verbatim,
 * which SonarCloud rightly flags as duplication on new code.
 *
 * The helper signatures return `Result<T, NextResponse>` (success | response)
 * so the handler can short-circuit with the canonical error response while
 * keeping the happy path linear.
 *
 *     export async function POST(request: NextRequest) {
 *       const auth = await requireAdmin()
 *       if (!auth.ok) return auth.error
 *
 *       const parsed = await parseJsonBody(request, mySchema)
 *       if (!parsed.ok) return parsed.error
 *
 *       // … route-specific logic with auth.value.email + parsed.value
 *     }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"
import { getAdminByEmail } from "@/lib/admin/users/repository"
import {
  type AccessLevel,
  type AdminFeature,
  type PermissionMap,
  hasAccess,
  resolvePermissions,
} from "@/lib/admin/permissions"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import type { AdminRole } from "@/lib/admin/users/schemas"

export interface AdminContext {
  readonly email: string
  /**
   * Authoritative admin role. For env-list members this is always "admin"
   * (they bypass the database). For DB-listed admins this reflects their
   * row's role column ("admin" | "manager" | "viewer").
   */
  readonly role: AdminRole
  /** "env" = listed in ADMIN_EMAILS env var; "db" = found in admin_users table. */
  readonly source: "env" | "db"
  /**
   * Effective permission map for this admin (preset for the role merged
   * with any per-user overrides from `admin_users.permissions`). Always
   * present so callers can use `hasAccess(ctx.permissions, ...)` directly.
   */
  readonly permissions: PermissionMap
}

/**
 * Resolve the current Supabase user and gate by either:
 *   1. the runtime admin_users table, OR
 *   2. the ADMIN_EMAILS env-var fallback (bootstrap path).
 *
 * The DB is consulted first so newly-invited admins gain access without
 * a redeploy. Env-list members default to role="admin".
 */
function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function forbiddenResponse(message: string): NextResponse {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message } },
    { status: 403 },
  )
}

export async function requireAdmin(): Promise<Result<AdminContext, NextResponse>> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  const email = user?.email
  if (!email) {
    return err(unauthorizedResponse())
  }

  // DB lookup is authoritative for both gating AND role resolution.
  // We do NOT collapse the role to "admin" the way the previous helper
  // did — `manager` and `viewer` rows preserve their actual access level
  // so requirePermission() can enforce them at the route layer.
  const dbResult = await getAdminByEmail(email).catch(() => null)
  const dbRow = dbResult?.ok ? dbResult.value : null
  if (dbRow && dbRow.is_active) {
    return ok({
      email,
      role: dbRow.role,
      source: "db",
      permissions: resolvePermissions(dbRow.role, dbRow.permissions),
    })
  }

  if (ADMIN_EMAILS.includes(email)) {
    return ok({
      email,
      role: "admin",
      source: "env",
      permissions: resolvePermissions("admin", null),
    })
  }
  return err(unauthorizedResponse())
}

/**
 * Gate an admin endpoint by feature + access level.
 *
 *   const auth = await requirePermission("leads", "full")
 *   if (!auth.ok) return auth.error
 *   // … caller is guaranteed admin AND has at least "full" leads access
 *
 * Returns 401 for unauthenticated callers, 403 for authenticated admins
 * who lack the required level. The required level defaults to "read".
 */
export async function requirePermission(
  feature: AdminFeature,
  required: AccessLevel = "read",
): Promise<Result<AdminContext, NextResponse>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!hasAccess(auth.value.permissions, feature, required)) {
    return err(
      forbiddenResponse(
        `${required} access to "${feature}" required (current: ${
          auth.value.permissions[feature] ?? "none"
        })`,
      ),
    )
  }
  return auth
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ")
}

/**
 * Parse JSON from the request and validate it against a Zod schema.
 * Returns the typed body or a 400 NextResponse with a clear error.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: NextRequest,
  schema: S,
): Promise<Result<z.infer<S>, NextResponse>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return err(
      NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 }),
    )
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return err(
      NextResponse.json(
        { error: formatZodIssues(parsed.error) },
        { status: 400 },
      ),
    )
  }
  return ok(parsed.data as z.infer<S>)
}
