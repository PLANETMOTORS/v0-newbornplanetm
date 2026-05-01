/**
 * Pure-function adapters between the Carfax envelope and our application
 * shape. Kept pure (no IO, no Date.now) so the unit tests are deterministic
 * and the route handlers can compose the result before persistence.
 */

import type {
  CarfaxBadgeRow,
  CarfaxBadgeSummary,
  CarfaxBadgesResponse,
} from "./schemas"
import { CARFAX_NO_VHR, CARFAX_OK } from "./schemas"

/**
 * Map a single Carfax row into the narrowed application summary.
 * `fetchedAt` is injected so callers control timestamping (DI-friendly).
 */
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
 * Pull the first row out of an outer envelope. We always request a single
 * VIN so taking the first row is correct; if the envelope is misshapen we
 * surface a synthetic "no VHR" row rather than throwing.
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

/**
 * Predicate used by the VDP component to decide whether to render the
 * "No accidents — Reported by Carfax" headline. Critical OMVIC rule:
 * we only make this claim when Carfax actually issued the AccidentFree
 * badge for this specific VIN — never as a blanket default.
 */
export function hasAccidentFreeBadge(summary: CarfaxBadgeSummary): boolean {
  return summary.badges.some((b) => b.name === "AccidentFree")
}

export function hasOneOwnerBadge(summary: CarfaxBadgeSummary): boolean {
  return summary.badges.some((b) => b.name === "OneOwner")
}

export function hasLowKilometerBadge(summary: CarfaxBadgeSummary): boolean {
  return summary.badges.some((b) => b.name === "LowKilometer")
}
