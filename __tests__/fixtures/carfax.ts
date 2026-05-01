/**
 * Shared test fixtures for the Carfax integration.
 *
 * Every Carfax test imports its constants from here so we never have
 * the same VIN / SUMMARY / ENV duplicated across multiple test files.
 * This keeps Sonar's duplication metric clean and means a single edit
 * (e.g. when Carfax adds a new field) fans out to every test.
 */

import type {
  CarfaxBadgeRow,
  CarfaxBadgeSummary,
  CarfaxBadgesResponse,
  CarfaxToken,
} from "@/lib/carfax/schemas"
import type { CarfaxEnv } from "@/lib/carfax/env"

export const FIXTURE_VIN = "1C6SRFHT6NN159638"

export const FIXTURE_NOW_ISO = "2026-05-01T12:00:00.000Z"

export const FIXTURE_ENV: CarfaxEnv = {
  CARFAX_AUTH_URL: "https://authentication.carfax.ca/oauth/token",
  CARFAX_API_URL: "https://badgingapi.carfax.ca/api/v3",
  CARFAX_AUDIENCE: "https://api.carfax.ca",
  CARFAX_CLIENT_ID: "test-client-id-1234",
  CARFAX_CLIENT_SECRET: "test-client-secret-long-enough-for-zod",
  CARFAX_ACCOUNT_NUMBER: "00000",
}

export const FIXTURE_TOKEN: CarfaxToken = {
  access_token: "eyJhbGc-fresh-token-VALUE-LONG-ENOUGH",
  scope: "list:vhr:badges:company",
  expires_in: 7200,
  token_type: "Bearer",
}

export const FIXTURE_BADGE_ROW_OK: CarfaxBadgeRow = {
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
  VhrReportUrl: "https://vhr.carfax.ca/?id=Y2PjSo7DQy0NlP1FO%2BvXuv8Wc%2FCdd8fT",
  VIN: FIXTURE_VIN,
  EncryptedId: "AecJKGYe%2FvesLYwlUMktdFMP02mq9Wyx",
  VhrSnapshotEnUrl: null,
  VhrSnapshotFrUrl: null,
  HoverHtml: "<img />",
  ResultCode: 1,
  ResultMessage: "Successful",
}

export const FIXTURE_BADGE_ROW_NO_VHR: CarfaxBadgeRow = {
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
  ResultCode: -10,
  ResultMessage: "No VHR report found.",
}

export function makeBadgesEnvelope(
  rows: CarfaxBadgeRow[],
): CarfaxBadgesResponse {
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

export const FIXTURE_BADGES_ENVELOPE_OK = makeBadgesEnvelope([FIXTURE_BADGE_ROW_OK])

export const FIXTURE_SUMMARY: CarfaxBadgeSummary = {
  vin: FIXTURE_VIN,
  hasBadge: true,
  hasCpoBadge: false,
  hasApoBadge: false,
  badges: [
    {
      name: "AccidentFree",
      type: 1,
      imageUrl: "https://cdn.carfax.ca/badging/v3/en/AccidentFree.svg",
    },
  ],
  badgesImageUrl: "https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree.svg",
  vhrReportUrl: "https://vhr.carfax.ca/?id=zz",
  reportNumber: 9001,
  hoverHtml: null,
  hasReport: true,
  resultCode: 1,
  resultMessage: "Successful",
  fetchedAt: FIXTURE_NOW_ISO,
}

/** Build a JSON Response with the supplied body + status. */
export function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  })
}
