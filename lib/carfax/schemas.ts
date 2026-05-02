/**
 * Zod schemas for the Carfax Canada Badging API v3 surface.
 *
 *   tokenResponseSchema  — POST /oauth/token   (Auth0 client_credentials)
 *   badgesResponseSchema — GET  /api/v3/badges (envelope w/ ResponseData.Badges)
 *
 * Carfax wraps every response in { ResponseData, ResultCode, ResultMessage }.
 * The success flag for a single VIN lives on ResponseData.Badges[0].ResultCode
 * (1 = ok, -10 = no VHR for this VIN). We surface both layers so callers can
 * distinguish "API call failed" from "no report exists for this VIN".
 */

import { z } from "zod"

// ── Auth0 token response ───────────────────────────────────────────────

export const tokenResponseSchema = z
  .object({
    access_token: z.string().min(20),
    scope: z.string().optional(),
    expires_in: z.number().int().positive(),
    token_type: z.literal("Bearer"),
  })
  .passthrough()

export type CarfaxToken = z.infer<typeof tokenResponseSchema>

// ── Badging API response ───────────────────────────────────────────────

const badgeItemSchema = z
  .object({
    BadgeName: z.string(),
    BadgeType: z.number().int(),
    BadgeImageUrl: z.string().url(),
  })
  .strict()

export type CarfaxBadgeItem = z.infer<typeof badgeItemSchema>

const badgeRowSchema = z
  .object({
    BadgeList: z.array(badgeItemSchema).nullable(),
    BadgesImageUrl: z.string().url().nullable(),
    HasBadge: z.boolean(),
    HasCpoBadge: z.boolean(),
    HasApoBadge: z.boolean(),
    RefNum: z.string().nullable(),
    ReportNumber: z.number().int(),
    VhrReportUrl: z.string().url().nullable(),
    VIN: z.string(),
    EncryptedId: z.string().nullable(),
    VhrSnapshotEnUrl: z.string().url().nullable(),
    VhrSnapshotFrUrl: z.string().url().nullable(),
    HoverHtml: z.string().nullable(),
    ResultCode: z.number().int(),
    ResultMessage: z.string(),
  })
  .strict()

export type CarfaxBadgeRow = z.infer<typeof badgeRowSchema>

export const badgesResponseSchema = z
  .object({
    ResponseData: z
      .object({
        // Carfax wraps the per-VIN row inside an array; in practice it
        // always has exactly one entry, but we accept an empty array so
        // the adapter's empty-fallback in envelopeToSummary() can handle
        // unexpected upstream responses without throwing a Zod error.
        Badges: z.array(badgeRowSchema),
        Language: z.union([z.literal("en"), z.literal("fr")]),
        LogoUrl: z.string().url(),
      })
      .strict(),
    ResultCode: z.number().int(),
    ResultMessage: z.string(),
  })
  .strict()

export type CarfaxBadgesResponse = z.infer<typeof badgesResponseSchema>

/** Outer envelope succeeded. */
export const CARFAX_OK = 1
/** Per-VIN: Carfax has no VHR record for this VIN. */
export const CARFAX_NO_VHR = -10

/**
 * Application-level summary used by the rest of the codebase. Decoupling
 * from the raw envelope means a future Carfax v4 release only requires
 * editing adapters.ts.
 */
export interface CarfaxBadgeSummary {
  readonly vin: string
  readonly hasBadge: boolean
  readonly hasCpoBadge: boolean
  readonly hasApoBadge: boolean
  readonly badges: ReadonlyArray<{
    readonly name: string
    readonly type: number
    readonly imageUrl: string
  }>
  readonly badgesImageUrl: string | null
  readonly vhrReportUrl: string | null
  readonly reportNumber: number | null
  readonly hoverHtml: string | null
  readonly hasReport: boolean
  /** Raw Carfax outcome (1 = ok, -10 = no VHR, other negatives = failure). */
  readonly resultCode: number
  readonly resultMessage: string
  /** ISO timestamp this summary was fetched from Carfax. */
  readonly fetchedAt: string
}
