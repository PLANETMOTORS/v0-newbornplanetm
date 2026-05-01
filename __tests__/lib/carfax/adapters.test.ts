import { describe, expect, it } from "vitest"
import {
  envelopeToSummary,
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
  rowToSummary,
} from "@/lib/carfax/adapters"
import type { CarfaxBadgeRow, CarfaxBadgesResponse } from "@/lib/carfax/schemas"
import { CARFAX_NO_VHR } from "@/lib/carfax/schemas"

const FETCHED_AT = "2026-05-01T12:00:00.000Z"

const ACCIDENT_FREE_ROW: CarfaxBadgeRow = {
  BadgeList: [
    {
      BadgeName: "AccidentFree",
      BadgeType: 1,
      BadgeImageUrl: "https://cdn.carfax.ca/badging/v3/en/AccidentFree.svg",
    },
    {
      BadgeName: "LowKilometer",
      BadgeType: 2,
      BadgeImageUrl: "https://cdn.carfax.ca/badging/v3/en/LowKilometer.svg",
    },
  ],
  BadgesImageUrl:
    "https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree_LowKilometer.svg",
  HasBadge: true,
  HasCpoBadge: false,
  HasApoBadge: false,
  RefNum: "",
  ReportNumber: 68907767,
  VhrReportUrl: "https://vhr.carfax.ca/?id=Y2PjSo7DQy0NlP1FO+vXuv8Wc/Cdd8fT",
  VIN: "W1KAF4HB5PR094601",
  EncryptedId: "AecJKGYe/vesLYwlUMktdFMP02mq9Wyx",
  VhrSnapshotEnUrl: null,
  VhrSnapshotFrUrl: null,
  HoverHtml: "<img />",
  ResultCode: 1,
  ResultMessage: "Successful",
}

const NO_VHR_ROW: CarfaxBadgeRow = {
  BadgeList: null,
  BadgesImageUrl: null,
  HasBadge: false,
  HasCpoBadge: false,
  HasApoBadge: false,
  RefNum: null,
  ReportNumber: 0,
  VhrReportUrl: null,
  VIN: "W1KAF4HB5PR094607",
  EncryptedId: null,
  VhrSnapshotEnUrl: null,
  VhrSnapshotFrUrl: null,
  HoverHtml: null,
  ResultCode: CARFAX_NO_VHR,
  ResultMessage: "No VHR report found.",
}

describe("rowToSummary", () => {
  it("maps all top-level fields verbatim and stamps fetchedAt", () => {
    const s = rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT)
    expect(s.vin).toBe(ACCIDENT_FREE_ROW.VIN)
    expect(s.hasBadge).toBe(true)
    expect(s.hasCpoBadge).toBe(false)
    expect(s.hasApoBadge).toBe(false)
    expect(s.vhrReportUrl).toBe(ACCIDENT_FREE_ROW.VhrReportUrl)
    expect(s.reportNumber).toBe(68907767)
    expect(s.hasReport).toBe(true)
    expect(s.fetchedAt).toBe(FETCHED_AT)
  })

  it("normalises BadgeList null into an empty array", () => {
    const s = rowToSummary(NO_VHR_ROW, FETCHED_AT)
    expect(s.badges).toEqual([])
  })

  it("collapses ReportNumber=0 into reportNumber=null", () => {
    const s = rowToSummary(NO_VHR_ROW, FETCHED_AT)
    expect(s.reportNumber).toBeNull()
  })

  it("hasReport tracks ResultCode === 1", () => {
    expect(rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT).hasReport).toBe(true)
    expect(rowToSummary(NO_VHR_ROW, FETCHED_AT).hasReport).toBe(false)
  })

  it("converts BadgeList items into the application shape", () => {
    const s = rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT)
    expect(s.badges).toEqual([
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
  function envelope(rows: CarfaxBadgeRow[]): CarfaxBadgesResponse {
    return {
      ResponseData: {
        Badges: rows as [CarfaxBadgeRow, ...CarfaxBadgeRow[]],
        Language: "en",
        LogoUrl: "https://cdn.carfax.ca/badging/v3/en/Logo.svg",
      },
      ResultCode: 1,
      ResultMessage: "Successful",
    }
  }

  it("uses the first row of the envelope (single-VIN call)", () => {
    const s = envelopeToSummary(envelope([ACCIDENT_FREE_ROW]), ACCIDENT_FREE_ROW.VIN, FETCHED_AT)
    expect(s.vin).toBe(ACCIDENT_FREE_ROW.VIN)
    expect(s.hasReport).toBe(true)
  })

  it("synthesises a no-VHR row if the envelope is empty (defensive)", () => {
    const s = envelopeToSummary(
      // Cast: schema rejects empty arrays, but the adapter must still cope
      // if we ever loosen the schema or hit a malformed fixture.
      { ResponseData: { Badges: [] as unknown as [CarfaxBadgeRow], Language: "en", LogoUrl: "https://cdn.carfax.ca/badging/v3/en/Logo.svg" }, ResultCode: 1, ResultMessage: "ok" },
      "MISSINGVIN12345AB",
      FETCHED_AT,
    )
    expect(s.vin).toBe("MISSINGVIN12345AB")
    expect(s.hasReport).toBe(false)
    expect(s.resultCode).toBe(CARFAX_NO_VHR)
  })
})

describe("badge predicates", () => {
  it("AccidentFree reflects the badge presence (the OMVIC-critical claim)", () => {
    const s = rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT)
    expect(hasAccidentFreeBadge(s)).toBe(true)
    expect(hasAccidentFreeBadge(rowToSummary(NO_VHR_ROW, FETCHED_AT))).toBe(false)
  })

  it("LowKilometer reflects the badge presence", () => {
    expect(hasLowKilometerBadge(rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT))).toBe(true)
  })

  it("OneOwner is false unless explicitly badged", () => {
    expect(hasOneOwnerBadge(rowToSummary(ACCIDENT_FREE_ROW, FETCHED_AT))).toBe(false)
    const oneOwner: CarfaxBadgeRow = {
      ...ACCIDENT_FREE_ROW,
      BadgeList: [
        {
          BadgeName: "OneOwner",
          BadgeType: 5,
          BadgeImageUrl: "https://cdn.carfax.ca/badging/v3/en/OneOwner.svg",
        },
      ],
    }
    expect(hasOneOwnerBadge(rowToSummary(oneOwner, FETCHED_AT))).toBe(true)
  })
})
