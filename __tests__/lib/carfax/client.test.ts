import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchBadges, fetchToken } from "@/lib/carfax/client"
import { clearCarfaxTokenCache, storeToken } from "@/lib/carfax/token-cache"
import {
  FIXTURE_BADGES_ENVELOPE_OK,
  FIXTURE_ENV,
  FIXTURE_NOW_ISO,
  FIXTURE_TOKEN,
  FIXTURE_VIN,
  jsonResponse,
  makeBadgesEnvelope,
} from "@/__tests__/fixtures/carfax"

beforeEach(() => {
  clearCarfaxTokenCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("fetchToken", () => {
  it("returns the access_token on a successful POST", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_TOKEN))
    const r = await fetchToken(FIXTURE_ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(FIXTURE_TOKEN.access_token)
    expect(mock).toHaveBeenCalledWith(
      FIXTURE_ENV.CARFAX_AUTH_URL,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("posts the URL-encoded form body Carfax expects", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_TOKEN))
    await fetchToken(FIXTURE_ENV, mock as unknown as typeof fetch)
    const body = mock.mock.calls[0][1].body as URLSearchParams
    expect(body.get("audience")).toBe(FIXTURE_ENV.CARFAX_AUDIENCE)
    expect(body.get("grant_type")).toBe("client_credentials")
    expect(body.get("client_id")).toBe(FIXTURE_ENV.CARFAX_CLIENT_ID)
    expect(body.get("client_secret")).toBe(FIXTURE_ENV.CARFAX_CLIENT_SECRET)
  })

  it("surfaces a 401 as http-error (not thrown)", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 }))
    const r = await fetchToken(FIXTURE_ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok && r.error.kind === "http-error") {
      expect(r.error.status).toBe(401)
    }
  })

  it("surfaces non-JSON bodies as non-json", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("plain text not json", { status: 200 }))
    const r = await fetchToken(FIXTURE_ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("non-json")
  })

  it("surfaces missing-fields JSON as schema-mismatch", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse({ access_token: "" }))
    const r = await fetchToken(FIXTURE_ENV, mock as unknown as typeof fetch)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("schema-mismatch")
  })
})

describe("fetchBadges", () => {
  it("returns a CarfaxBadgeSummary on a successful round trip", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_BADGES_ENVELOPE_OK))
    const r = await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.vin).toBe(FIXTURE_VIN)
      expect(r.value.hasReport).toBe(true)
      expect(r.value.badges[0]?.name).toBe("AccidentFree")
      expect(r.value.fetchedAt).toBe(FIXTURE_NOW_ISO)
    }
  })

  it("uses the cached token (no /oauth/token call)", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_BADGES_ENVELOPE_OK))
    await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0][0]).toContain("/badges?")
  })

  it("mints a token when none cached, then fetches badges (2 calls)", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_TOKEN))
      .mockResolvedValueOnce(jsonResponse(FIXTURE_BADGES_ENVELOPE_OK))
    const r = await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(true)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.mock.calls[0][0]).toBe(FIXTURE_ENV.CARFAX_AUTH_URL)
    expect(mock.mock.calls[1][0]).toContain("/badges?")
  })

  it("sends CompanyId, Vin, HideVin=false on the badge request", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_BADGES_ENVELOPE_OK))
    await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    const url = new URL(mock.mock.calls[0][0])
    expect(url.searchParams.get("CompanyId")).toBe(FIXTURE_ENV.CARFAX_ACCOUNT_NUMBER)
    expect(url.searchParams.get("Vin")).toBe(FIXTURE_VIN)
    expect(url.searchParams.get("HideVin")).toBe("false")
  })

  it("includes the Auth0CarfaxCanadaJWTBearer header verbatim", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi.fn().mockResolvedValue(jsonResponse(FIXTURE_BADGES_ENVELOPE_OK))
    await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    const init = mock.mock.calls[0][1] as RequestInit & { headers: Record<string, string> }
    expect(init.headers.Auth0CarfaxCanadaJWTBearer).toBe(FIXTURE_TOKEN.access_token)
  })

  it("rejects an invalid VIN before any network call", async () => {
    const mock = vi.fn()
    const r = await fetchBadges(FIXTURE_ENV, "BAD-VIN", mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("invalid-vin")
    expect(mock).not.toHaveBeenCalled()
  })

  it("returns http-error on non-2xx from /badges", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi
      .fn()
      .mockResolvedValue(new Response("500 - bad gateway", { status: 502 }))
    const r = await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok && r.error.kind === "http-error") {
      expect(r.error.status).toBe(502)
    }
  })

  it("returns schema-mismatch when JSON does not match the schema", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const mock = vi.fn().mockResolvedValue(jsonResponse({ ResponseData: {} }))
    const r = await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("schema-mismatch")
  })

  it("returns hasReport=false when Carfax replies with ResultCode=-10", async () => {
    storeToken(FIXTURE_ENV.CARFAX_CLIENT_ID, FIXTURE_TOKEN)
    const noVhrEnvelope = makeBadgesEnvelope([
      {
        BadgeList: null,
        BadgesImageUrl: null,
        HasBadge: false,
        HasCpoBadge: false,
        HasApoBadge: false,
        RefNum: null,
        ReportNumber: 0,
        VhrReportUrl: null,
        VIN: FIXTURE_VIN,
        EncryptedId: null,
        VhrSnapshotEnUrl: null,
        VhrSnapshotFrUrl: null,
        HoverHtml: null,
        ResultCode: -10,
        ResultMessage: "No VHR report found.",
      },
    ])
    const mock = vi.fn().mockResolvedValue(jsonResponse(noVhrEnvelope))
    const r = await fetchBadges(FIXTURE_ENV, FIXTURE_VIN, mock as unknown as typeof fetch, () => FIXTURE_NOW_ISO)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.hasReport).toBe(false)
      expect(r.value.resultCode).toBe(-10)
    }
  })
})
