/**
 * Persistence layer for admin user management.
 *
 * Every fallible boundary returns Result<T, RepoError>. The route handler
 * maps the error variants to canonical NextResponse status codes.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import type {
  AdminRole,
  AdminUserRow,
  InviteAdminRequest,
  UpdateAdminRequest,
  PermissionMap,
} from "./schemas"

export type AdminUserRepoError =
  | { readonly kind: "not-found" }
  | { readonly kind: "duplicate-email"; readonly email: string }
  | { readonly kind: "db-error"; readonly message: string; readonly code?: string }
  | { readonly kind: "exception"; readonly message: string }

type AdminClient = ReturnType<typeof createAdminClient>
type ClientFactory = () => AdminClient

/** Postgres unique-violation code (citext UNIQUE on email). */
const PG_UNIQUE_VIOLATION = "23505"

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "unknown error"
}

function dbError(
  message: string,
  code?: string,
): { kind: "db-error"; message: string; code?: string } {
  return code ? { kind: "db-error", message, code } : { kind: "db-error", message }
}

export async function listAdmins(
  factory: ClientFactory = createAdminClient,
): Promise<Result<readonly AdminUserRow[], AdminUserRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return err(dbError(error.message, error.code))
    return ok((data ?? []) as readonly AdminUserRow[])
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

export async function getAdminByEmail(
  email: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<AdminUserRow | null, AdminUserRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    return ok((data ?? null) as AdminUserRow | null)
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

/**
 * Returns true iff the email belongs to an active admin row.
 * Use from server-side gates that need the authoritative admin check.
 */
export async function isActiveAdmin(
  email: string,
  factory: ClientFactory = createAdminClient,
): Promise<boolean> {
  const result = await getAdminByEmail(email, factory)
  return result.ok && result.value?.is_active === true
}

export async function inviteAdmin(
  input: InviteAdminRequest,
  invitedBy: string | null,
  factory: ClientFactory = createAdminClient,
): Promise<Result<AdminUserRow, AdminUserRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from("admin_users")
      .insert({
        email: input.email,
        role: input.role,
        invited_by: invitedBy,
        notes: input.notes ?? null,
        permissions: input.permissions ?? null,
        is_active: true,
      })
      .select("*")
      .single()
    if (error) {
      const code = (error as { code?: string }).code
      if (code === PG_UNIQUE_VIOLATION) {
        return err({ kind: "duplicate-email", email: input.email })
      }
      return err(dbError(error.message, code))
    }
    if (!data) return err(dbError("insert returned no row"))
    return ok(data as AdminUserRow)
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

export async function updateAdmin(
  id: string,
  input: UpdateAdminRequest,
  factory: ClientFactory = createAdminClient,
): Promise<Result<AdminUserRow, AdminUserRepoError>> {
  try {
    const client = factory()
    const patch: { role?: AdminRole; is_active?: boolean; notes?: string | null; permissions?: Partial<PermissionMap> | null } = {}
    if (input.role !== undefined) patch.role = input.role
    if (input.is_active !== undefined) patch.is_active = input.is_active
    if (input.notes !== undefined) patch.notes = input.notes
    if (input.permissions !== undefined) patch.permissions = input.permissions
    const { data, error } = await client
      .from("admin_users")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    if (!data) return err({ kind: "not-found" })
    return ok(data as AdminUserRow)
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}

export async function deactivateAdmin(
  id: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<AdminUserRow, AdminUserRepoError>> {
  return updateAdmin(id, { is_active: false }, factory)
}

export async function deleteAdmin(
  id: string,
  factory: ClientFactory = createAdminClient,
): Promise<Result<{ id: string }, AdminUserRepoError>> {
  try {
    const client = factory()
    const { data, error } = await client
      .from("admin_users")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) return err(dbError(error.message, error.code))
    if (!data) return err({ kind: "not-found" })
    return ok({ id: data.id as string })
  } catch (error_) {
    return err({ kind: "exception", message: describe(error_) })
  }
}
