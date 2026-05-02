/**
 * Zod schemas for the admin test-data cleanup endpoint.
 *
 * Two operating modes share a discriminated-union body:
 *   - `by-id`         → caller supplies an explicit list of UUIDs
 *   - `test-pattern`  → server matches rows whose name/email looks like a
 *                       known QA fixture, optionally with `dryRun` so a
 *                       caller can preview before deleting.
 *
 * The response shape is intentionally kept minimal at this layer; the
 * route composes the success payload from this body + the repository
 * outputs.
 */

import { z } from "zod"

export const CLEANABLE_TABLES = [
  "leads",
  "reservations",
  "trade_in_quotes",
] as const

export type CleanableTable = (typeof CLEANABLE_TABLES)[number]

export const MAX_IDS_PER_CALL = 100

const idsField = z
  .array(z.string().trim().min(1, "id cannot be empty"))
  .min(1, "ids[] required and non-empty")
  .max(MAX_IDS_PER_CALL, `Max ${MAX_IDS_PER_CALL} ids per call`)

export const cleanupByIdSchema = z
  .object({
    mode: z.literal("by-id"),
    table: z.enum(CLEANABLE_TABLES),
    ids: idsField,
  })
  .strict()

export const cleanupTestPatternSchema = z
  .object({
    mode: z.literal("test-pattern"),
    /** When omitted or true, the call is non-destructive. */
    dryRun: z.boolean().optional().default(true),
  })
  .strict()

export const cleanupBodySchema = z.discriminatedUnion("mode", [
  cleanupByIdSchema,
  cleanupTestPatternSchema,
])

export type CleanupByIdBody = z.infer<typeof cleanupByIdSchema>
export type CleanupTestPatternBody = z.infer<typeof cleanupTestPatternSchema>
export type CleanupBody = z.infer<typeof cleanupBodySchema>

/** Names that historically ended up in production tables during QA. */
export const TEST_NAME_PATTERNS = [
  "Devin Test",
  "Devin",
  "Toni Sultzberg",
  "Thigg Egg",
  "Thigg",
  "Egg",
] as const

/** Email shapes that almost certainly belong to test fixtures. */
export const TEST_EMAIL_PATTERNS = [
  "%test%@%",
  "%@example.com",
  "devin%@%",
  "thigg%@%",
] as const
