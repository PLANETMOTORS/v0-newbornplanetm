/**
 * Pure adapters between the Carfax envelope and our application shape.
 * No IO, no Date.now — callers control timestamps so unit tests are
 * deterministic and the route handlers can compose results before
 * persistence.
 */

import type {
  CarfaxBadgeRow,
  CarfaxBadgeSummary,
  CarfaxBadgesResponse,
} from "./schemas"
import { CARFAX_NO_VHR, CARFAX_OK } from "./schemas"

export function rowToSummary(
  row: CarfaxBadgeRow,
  fetchedAt: string,
): CarfaxBadgeSummary {
  const list = row.BadgeList ?? []
  return {
    vin: row.VIN,
    hasBadge: row.HasBadge,
    hasCpoBadge: row.HasCpoBadge,
    hasApoBadge: row.HasApoBadge,
    badges: list.map((b) => ({
      name: b.BadgeName,
      type: b.BadgeType,
      imageUrl: b.BadgeImageUrl,
    })),
    badgesImageUrl: row.BadgesImageUrl,
    vhrReportUrl: row.VhrReportUrl,
    reportNumber: row.ReportNumber > 0 ? row.ReportNumber : null,
    hoverHtml: row.HoverHtml,
    hasReport: row.ResultCode === CARFAX_OK,
    resultCode: row.ResultCode,
    resultMessage: row.ResultMessage,
    fetchedAt,
  }
}

/**
 * Pull the first row from a single-VIN envelope. We always request a single
 * VIN, so taking [0] is correct; if the envelope is misshapen we synthesise
 * a "no VHR" row rather than throwing.
 */
export function envelopeToSummary(
  envelope: CarfaxBadgesResponse,
  vin: string,
  fetchedAt: string,
): CarfaxBadgeSummary {
  const row = envelope.ResponseData.Badges[0]
  if (!row) {
    return {
      vin,
      hasBadge: false,
      hasCpoBadge: false,
      hasApoBadge: false,
      badges: [],
      badgesImageUrl: null,
      vhrReportUrl: null,
      reportNumber: null,
      hoverHtml: null,
      hasReport: false,
      resultCode: CARFAX_NO_VHR,
      resultMessage: "No VHR report found.",
      fetchedAt,
    }
  }
  return rowToSummary(row, fetchedAt)
}

function hasBadgeNamed(summary: CarfaxBadgeSummary, name: string): boolean {
  return summary.badges.some((b) => b.name === name)
}

/**
 * Predicates used by the VDP component. Critical OMVIC rule:
 * "No reported accidents" only when Carfax actually issued the
 * AccidentFree badge for THIS specific VIN — never as a default.
 */
export const hasAccidentFreeBadge = (s: CarfaxBadgeSummary): boolean =>
  hasBadgeNamed(s, "AccidentFree")
export const hasOneOwnerBadge = (s: CarfaxBadgeSummary): boolean =>
  hasBadgeNamed(s, "OneOwner")
export const hasLowKilometerBadge = (s: CarfaxBadgeSummary): boolean =>
  hasBadgeNamed(s, "LowKilometer")

/**
 * Human-readable label used as `alt` text for a Carfax badge image.
 * Carfax returns internal identifiers like "AccidentFree"; WCAG requires
 * the alt attribute be a meaningful description, not the raw id. Falls
 * back to splitting CamelCase for any badge name not yet mapped.
 */
const BADGE_LABELS: Readonly<Record<string, string>> = {
  AccidentFree: "Accident free",
  OneOwner: "One owner",
  LowKilometer: "Low kilometres",
  ServiceRecords: "Service records",
  PersonalUse: "Personal use",
}

export function badgeAccessibleLabel(name: string): string {
  const mapped = BADGE_LABELS[name]
  if (mapped) return `Carfax badge: ${mapped}`
  const split = name.replace(/([A-Z])/g, " $1").trim()
  return `Carfax badge: ${split}`
}
