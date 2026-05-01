import { describe, expect, it } from "vitest"
import {
  badgeAccessibleLabel,
  envelopeToSummary,
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
  rowToSummary,
} from "@/lib/carfax/adapters"
import { CARFAX_NO_VHR } from "@/lib/carfax/schemas"
import type { CarfaxBadgeRow } from "@/lib/carfax/schemas"
import {
  FIXTURE_BADGE_ROW_NO_VHR,
  FIXTURE_BADGE_ROW_OK,
  FIXTURE_NOW_ISO,
  makeBadgesEnvelope,
} from "@/__tests__/fixtures/carfax"

describe("rowToSummary", () => {
  it("maps all top-level fields verbatim and stamps fetchedAt", () => {
    const s = rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO)
    expect(s.vin).toBe(FIXTURE_BADGE_ROW_OK.VIN)
    expect(s.hasBadge).toBe(true)
    expect(s.hasCpoBadge).toBe(false)
    expect(s.hasApoBadge).toBe(false)
    expect(s.vhrReportUrl).toBe(FIXTURE_BADGE_ROW_OK.VhrReportUrl)
    expect(s.reportNumber).toBe(68907767)
    expect(s.hasReport).toBe(true)
    expect(s.fetchedAt).toBe(FIXTURE_NOW_ISO)
  })

  it("normalises BadgeList null into an empty array", () => {
    expect(rowToSummary(FIXTURE_BADGE_ROW_NO_VHR, FIXTURE_NOW_ISO).badges).toEqual([])
  })

  it("collapses ReportNumber=0 into reportNumber=null", () => {
    expect(rowToSummary(FIXTURE_BADGE_ROW_NO_VHR, FIXTURE_NOW_ISO).reportNumber).toBeNull()
  })

  it("hasReport tracks ResultCode === 1", () => {
    expect(rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO).hasReport).toBe(true)
    expect(rowToSummary(FIXTURE_BADGE_ROW_NO_VHR, FIXTURE_NOW_ISO).hasReport).toBe(false)
  })

  it("converts BadgeList items into the application shape", () => {
    expect(rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO).badges).toEqual([
      {
        name: "AccidentFree",
        type: 1,
        imageUrl: "https://cdn.carfax.ca/badging/v3/en/AccidentFree.svg",
      },
      {
        name: "LowKilometer",
        type: 2,
        imageUrl: "https://cdn.carfax.ca/badging/v3/en/LowKilometer.svg",
      },
    ])
  })
})

describe("envelopeToSummary", () => {
  it("uses the first row of the envelope (single-VIN call)", () => {
    const envelope = makeBadgesEnvelope([FIXTURE_BADGE_ROW_OK])
    const s = envelopeToSummary(envelope, FIXTURE_BADGE_ROW_OK.VIN, FIXTURE_NOW_ISO)
    expect(s.vin).toBe(FIXTURE_BADGE_ROW_OK.VIN)
    expect(s.hasReport).toBe(true)
  })

  it("synthesises a no-VHR row when the envelope is empty (defensive)", () => {
    // Schema now allows empty arrays so the adapter fallback is reachable
    // when Carfax returns an unexpected zero-row response.
    const empty = {
      ResponseData: {
        Badges: [] as readonly CarfaxBadgeRow[],
        Language: "en" as const,
        LogoUrl: "https://cdn.carfax.ca/badging/v3/en/Logo.svg",
      },
      ResultCode: 1,
      ResultMessage: "ok",
    }
    const s = envelopeToSummary(empty, "MISSINGVIN12345AB", FIXTURE_NOW_ISO)
    expect(s.vin).toBe("MISSINGVIN12345AB")
    expect(s.hasReport).toBe(false)
    expect(s.resultCode).toBe(CARFAX_NO_VHR)
  })
})

describe("badgeAccessibleLabel", () => {
  it("maps known badge ids to descriptive labels", () => {
    expect(badgeAccessibleLabel("AccidentFree")).toBe("Carfax badge: Accident free")
    expect(badgeAccessibleLabel("OneOwner")).toBe("Carfax badge: One owner")
    expect(badgeAccessibleLabel("LowKilometer")).toBe("Carfax badge: Low kilometres")
  })

  it("falls back to a CamelCase split for unmapped ids", () => {
    expect(badgeAccessibleLabel("HighwayUse")).toBe("Carfax badge: Highway Use")
  })
})

describe("badge predicates", () => {
  it("AccidentFree reflects badge presence (the OMVIC-critical claim)", () => {
    expect(hasAccidentFreeBadge(rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO))).toBe(true)
    expect(hasAccidentFreeBadge(rowToSummary(FIXTURE_BADGE_ROW_NO_VHR, FIXTURE_NOW_ISO))).toBe(false)
  })

  it("LowKilometer reflects badge presence", () => {
    expect(hasLowKilometerBadge(rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO))).toBe(true)
  })

  it("OneOwner is false unless explicitly badged", () => {
    expect(hasOneOwnerBadge(rowToSummary(FIXTURE_BADGE_ROW_OK, FIXTURE_NOW_ISO))).toBe(false)
    const row: CarfaxBadgeRow = {
      ...FIXTURE_BADGE_ROW_OK,
      BadgeList: [
        {
          BadgeName: "OneOwner",
          BadgeType: 5,
          BadgeImageUrl: "https://cdn.carfax.ca/badging/v3/en/OneOwner.svg",
        },
      ],
    }
    expect(hasOneOwnerBadge(rowToSummary(row, FIXTURE_NOW_ISO))).toBe(true)
  })
})
