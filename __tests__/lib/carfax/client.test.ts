import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchBadges, fetchToken, normaliseVin } from "@/lib/carfax/client"
import { clearCarfaxTokenCache, storeToken } from "@/lib/carfax/token-cache"
import type { CarfaxEnv } from "@/lib/carfax/env"

const ENV: CarfaxEnv = {
  CARFAX_AUTH_URL: "https://authentication.carfax.ca/oauth/token",
  CARFAX_API_URL: "https://badgingapi.carfax.ca/api/v3",
  CARFAX_AUDIENCE: "https://api.carfax.ca",
  CARFAX_CLIENT_ID: "test-client-id-1234",
  CARFAX_CLIENT_SECRET: "test-client-secret-long-enough-for-zod",
  CARFAX_ACCOUNT_NUMBER: "00000",
}

const NOW_ISO = "2026-05-01T12:00:00.000Z"
const VALID_VIN = "1C6SRFHT6NN159638"

const VALID_TOKEN_BODY = {
  access_token: "eyJhbGc-fresh-token-VALUE-LONG-ENOUGH",
  scope: "list:vhr:badges:company",
  expires_in: 7200,
  token_type: "Bearer",
}

const VALID_BADGES_BODY = {
  ResponseData: {
    Badges: [
      {
        BadgeList: [
          {
            BadgeName: "AccidentFree",
            BadgeType: 1,
            BadgeImageUrl: "https://cdn.carfax.ca/badging/v3/en/AccidentFree.svg",
          },
        ],
        BadgesImageUrl: "https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree.svg",
        HasBadge: true,
        HasCpoBadge: false,
        HasApoBadge: false,
        RefNum: "",
        ReportNumber: 68907767,
        VhrReportUrl: "https://vhr.carfax.ca/?id=Y2PjSo7DQy0NlP1FO+vXuv8Wc/Cdd8fT",
        VIN: VALID_VIN,
        EncryptedId: "AecJKGYe/vesLYwlUMktdFMP02mq9Wyx",
        VhrSnapshotEnUrl: null,
        VhrSnapshotFrUrl: null,
        HoverHtml: "<img />",
        ResultCode: 1,
        ResultMessage: "Successful",
      },
    ],
    Language: "en",
    LogoUrl: "https://cdn.carfax.ca/badging/v3/en/Logo.svg",
  },
  ResultCode: 1,
  ResultMessage: "Successful",
}

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  })
}

beforeEach(() => {
  clearCarfaxTokenCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("normaliseVin", () => {
  it("uppercases + trims a valid VIN", () => {
    const r = normaliseVin("  1c6srfht6nn159638  ")
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(VALID_VIN)
  })

  it("rejects VINs containing I/O/Q (forbidden NA characters)", () => {
    const r = normaliseVin("1C6SRFHT6NN1596I3")
    expect(r.ok).toBe(false)
  })

  it("rejects too-short VINs", () => {
    const r = normaliseVin("1C6SRFHT6NN")
    expect(r.ok).toBe(false)
  })

  it("rejects too-long VINs", () => {
    const r = normaliseVin("1C6SRFHT6NN159638EXTRA")
    expect(r.ok).toBe(false)
  })
})

describe("fetchToken", () => {
  it("returns the access_token on a successful POST", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_TOKEN_BODY))
    const r = await fetchToken(ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(VALID_TOKEN_BODY.access_token)
    expect(mock).toHaveBeenCalledWith(
      ENV.CARFAX_AUTH_URL,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("posts the URL-encoded form body Carfax expects", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_TOKEN_BODY))
    await fetchToken(ENV, mock as unknown as typeof fetch)
    const body = mock.mock.calls[0][1].body as URLSearchParams
    expect(body.get("audience")).toBe(ENV.CARFAX_AUDIENCE)
    expect(body.get("grant_type")).toBe("client_credentials")
    expect(body.get("client_id")).toBe(ENV.CARFAX_CLIENT_ID)
    expect(body.get("client_secret")).toBe(ENV.CARFAX_CLIENT_SECRET)
  })

  it("surfaces a 401 as auth-failed (not thrown)", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 }))
    const r = await fetchToken(ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("auth-failed")
      if (r.error.kind === "auth-failed") expect(r.error.status).toBe(401)
    }
  })

  it("surfaces non-JSON bodies as auth-invalid-response", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("plain text not json", { status: 200 }))
    const r = await fetchToken(ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("auth-invalid-response")
  })

  it("surfaces JSON missing required fields as auth-invalid-response", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse({ access_token: "" }))
    const r = await fetchToken(ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("auth-invalid-response")
  })
})

describe("fetchBadges", () => {
  it("returns a CarfaxBadgeSummary on a successful round trip", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_BADGES_BODY))
    const r = await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.vin).toBe(VALID_VIN)
      expect(r.value.hasReport).toBe(true)
      expect(r.value.badges[0]?.name).toBe("AccidentFree")
      expect(r.value.fetchedAt).toBe(NOW_ISO)
    }
  })

  it("uses the cached token when present (no /oauth/token call)", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_BADGES_BODY))
    await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0][0]).toContain("/badges?")
  })

  it("mints a token when none cached, then fetches badges (2 calls)", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(VALID_TOKEN_BODY))
      .mockResolvedValueOnce(jsonResponse(VALID_BADGES_BODY))
    const r = await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(true)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.mock.calls[0][0]).toBe(ENV.CARFAX_AUTH_URL)
    expect(mock.mock.calls[1][0]).toContain("/badges?")
  })

  it("sends CompanyId, Vin, HideVin=false on the badge request", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_BADGES_BODY))
    await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    const url = new URL(mock.mock.calls[0][0])
    expect(url.searchParams.get("CompanyId")).toBe(ENV.CARFAX_ACCOUNT_NUMBER)
    expect(url.searchParams.get("Vin")).toBe(VALID_VIN)
    expect(url.searchParams.get("HideVin")).toBe("false")
  })

  it("includes the Auth0CarfaxCanadaJWTBearer header verbatim", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi.fn().mockResolvedValue(jsonResponse(VALID_BADGES_BODY))
    await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    const init = mock.mock.calls[0][1] as RequestInit & { headers: Record<string, string> }
    expect(init.headers.Auth0CarfaxCanadaJWTBearer).toBe(VALID_TOKEN_BODY.access_token)
  })

  it("rejects an invalid VIN before any network call", async () => {
    const mock = vi.fn()
    const r = await fetchBadges(ENV, "BAD-VIN", mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("invalid-vin")
    expect(mock).not.toHaveBeenCalled()
  })

  it("returns badges-http-error on non-2xx from /badges", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("500 - bad gateway", { status: 502 }))
    const r = await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("badges-http-error")
      if (r.error.kind === "badges-http-error") expect(r.error.status).toBe(502)
    }
  })

  it("returns badges-invalid-response when JSON does not match the schema", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const mock = vi.fn().mockResolvedValue(jsonResponse({ ResponseData: {} }))
    const r = await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("badges-invalid-response")
  })

  it("returns hasReport=false when Carfax replies with ResultCode=-10", async () => {
    storeToken(ENV.CARFAX_CLIENT_ID, VALID_TOKEN_BODY)
    const noVhrBody = {
      ...VALID_BADGES_BODY,
      ResponseData: {
        ...VALID_BADGES_BODY.ResponseData,
        Badges: [
          {
            ...VALID_BADGES_BODY.ResponseData.Badges[0],
            BadgeList: null,
            BadgesImageUrl: null,
            HasBadge: false,
            ReportNumber: 0,
            VhrReportUrl: null,
            EncryptedId: null,
            HoverHtml: null,
            ResultCode: -10,
            ResultMessage: "No VHR report found.",
          },
        ],
      },
    }
    const mock = vi.fn().mockResolvedValue(jsonResponse(noVhrBody))
    const r = await fetchBadges(ENV, VALID_VIN, mock as unknown as typeof fetch, () => NOW_ISO)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.hasReport).toBe(false)
      expect(r.value.resultCode).toBe(-10)
    }
  })
})
