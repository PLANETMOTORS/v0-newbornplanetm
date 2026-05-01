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
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import type { AdminRole, PermissionMap } from "@/lib/admin/users/schemas"
import {
  resolvePermissions,
  hasAccess,
  type AdminFeature,
  type AccessLevel,
} from "@/lib/admin/permissions"

export interface AdminContext {
  readonly email: string
  readonly role: AdminRole
  /** "env" = listed in ADMIN_EMAILS env var; "db" = found in admin_users table. */
  readonly source: "env" | "db"
  /** Resolved permissions for the admin user. */
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
export async function requireAdmin(): Promise<Result<AdminContext, NextResponse>> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  const email = user?.email
  if (!email) {
    return err(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
  }

  // Check DB for full admin row (includes role + custom permissions)
  const dbResult = await getAdminByEmail(email).catch(() => null)
  if (dbResult && dbResult.ok && dbResult.value?.is_active) {
    const adminRow = dbResult.value
    return ok({
      email,
      role: adminRow.role,
      source: "db",
      permissions: resolvePermissions(adminRow.role, adminRow.permissions),
    })
  }

  if (ADMIN_EMAILS.includes(email)) {
    return ok({
      email,
      role: "admin",
      source: "env",
      permissions: resolvePermissions("admin"),
    })
  }
  return err(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
}

/**
 * Check if the admin context has the required access level for a feature.
 * Returns a 403 NextResponse if access is denied, or null if allowed.
 */
export function requireFeatureAccess(
  ctx: AdminContext,
  feature: AdminFeature,
  requiredLevel: AccessLevel = "read",
): NextResponse | null {
  if (hasAccess(ctx.permissions, feature, requiredLevel)) {
    return null
  }
  return NextResponse.json(
    {
      error: {
        code: "FORBIDDEN",
        message: `You do not have ${requiredLevel} access to ${feature}`,
      },
    },
    { status: 403 },
  )
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
