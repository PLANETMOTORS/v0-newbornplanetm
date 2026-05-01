/**
 * Zod schemas for the admin-users management endpoints.
 *
 * Roles
 * -----
 *   admin    full access (manage admins, finances, all destructive actions)
 *   manager  inventory + leads management, no destructive admin operations
 *   viewer   read-only across the dashboard
 */

import { z } from "zod"

export const ADMIN_ROLES = ["admin", "manager", "viewer"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

const EMAIL_MAX = 254
const NOTES_MAX = 2_000

const trimmedEmail = z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX)
  .email("invalid email")

export const inviteAdminSchema = z
  .object({
    email: trimmedEmail,
    role: z.enum(ADMIN_ROLES).default("admin"),
    notes: z.string().max(NOTES_MAX).optional(),
  })
  .strict()

export type InviteAdminRequest = z.infer<typeof inviteAdminSchema>

export const updateAdminSchema = z
  .object({
    role: z.enum(ADMIN_ROLES).optional(),
    is_active: z.boolean().optional(),
    notes: z.string().max(NOTES_MAX).nullable().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.role !== undefined ||
      v.is_active !== undefined ||
      v.notes !== undefined,
    { message: "no editable fields supplied" },
  )

export type UpdateAdminRequest = z.infer<typeof updateAdminSchema>

export const adminUserIdParamSchema = z
  .object({ id: z.string().uuid("admin user id must be a uuid") })
  .strict()

export type AdminUserIdParam = z.infer<typeof adminUserIdParamSchema>

export interface AdminUserRow {
  readonly id: string
  readonly email: string
  readonly role: AdminRole
  readonly is_active: boolean
  readonly invited_by: string | null
  readonly notes: string | null
  readonly created_at: string
  readonly updated_at: string
}
