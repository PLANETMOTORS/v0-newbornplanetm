/**
 * Zod allow-list schemas for admin PATCH endpoints.
 *
 * SECURITY RATIONALE
 * ------------------
 * Several admin PATCH routes used to spread the request body straight into
 * Supabase `.update()`:
 *
 *     const { id, ...updates } = await request.json()
 *     await admin.from("reservations").update(updates).eq("id", id)
 *
 * That is a textbook OWASP API3 mass-assignment vulnerability. A
 * compromised admin session — or an admin acting in bad faith — could
 * rewrite columns that were never intended to be admin-editable
 * (customer_email, vehicle_id, deposit_amount, created_at, etc.).
 *
 * This module centralises the canonical list of admin-mutable columns per
 * resource. Each schema:
 *   - rejects unknown keys (`.strict()`)
 *   - validates each field's type and value domain
 *   - returns the parsed object — caller pipes it into `.update()`.
 *
 * If you need to add a new admin-mutable field, add it here and add a
 * test, do NOT inline-extend the route handler.
 */

import { z } from "zod"

// ── Reservations ───────────────────────────────────────────────────────────

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
] as const

export const DEPOSIT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const

export const adminReservationPatchSchema = z
  .object({
    status: z.enum(RESERVATION_STATUSES).optional(),
    deposit_status: z.enum(DEPOSIT_STATUSES).optional(),
    expires_at: z.string().datetime({ offset: true }).optional(),
    internal_notes: z.string().max(4000).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
  })
  .strict()

export type AdminReservationPatch = z.infer<typeof adminReservationPatchSchema>

// ── Leads ──────────────────────────────────────────────────────────────────

/**
 * Lead pipeline statuses. Mirrors the buttons rendered on
 * `app/admin/leads/page.tsx` — keep these two surfaces in lock-step.
 *
 * `negotiating` was added when the admin UI started rendering a
 * "negotiating" stage button. Without the schema entry the PATCH
 * returned a silent 400 and the button looked broken.
 */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "negotiating",
  "converted",
  "lost",
  "archived",
] as const

export const adminLeadPatchSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    notes: z.string().max(8000).optional(),
    internal_notes: z.string().max(8000).optional(),
  })
  .strict()

export type AdminLeadPatch = z.infer<typeof adminLeadPatchSchema>

// ── Helper: parse OR return a friendly 400 detail array ────────────────────

export function parseAdminPatch<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown
): { ok: true; data: z.infer<T> } | { ok: false; issues: string[] } {
  const r = schema.safeParse(raw)
  if (r.success) return { ok: true, data: r.data }
  return {
    ok: false,
    issues: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  }
}
