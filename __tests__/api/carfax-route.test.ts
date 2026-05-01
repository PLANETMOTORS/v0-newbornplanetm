/**
 * Route-level coverage for GET /api/v1/carfax/[vin].
 * Mocks every IO dependency (rate-limit, cache, live fetch, env) so we
 * can prove the layered cache → live → stale-fallback sequencing without
 * actually contacting Carfax.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { FIXTURE_ENV, FIXTURE_SUMMARY, FIXTURE_VIN } from "@/__tests__/fixtures/carfax"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

const rateLimitMock = vi.fn(async () => ({ success: true, remaining: 30 }))
vi.mock("@/lib/redis", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...(args as [string, number, number])),
}))

const readCarfaxEnvMock = vi.fn()
vi.mock("@/lib/carfax/env", () => ({
  readCarfaxEnv: () => readCarfaxEnvMock(),
}))

const fetchBadgesMock = vi.fn()
vi.mock("@/lib/carfax/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/carfax/client")>(
    "@/lib/carfax/client",
  )
  return {
    ...actual,
    fetchBadges: (...args: unknown[]) => fetchBadgesMock(...args),
  }
})

const getCachedSummaryMock = vi.fn()
const upsertSummaryMock = vi.fn()
vi.mock("@/lib/carfax/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/carfax/repository")
  >("@/lib/carfax/repository")
  return {
    ...actual,
    getCachedSummary: (...args: unknown[]) => getCachedSummaryMock(...args),
    upsertSummary: (...args: unknown[]) => upsertSummaryMock(...args),
  }
})

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const FRESH_SUMMARY = {
  ...FIXTURE_SUMMARY,
  fetchedAt: new Date(Date.now() - 60 * 60 * 1_000).toISOString(),
}

const STALE_SUMMARY = {
  ...FRESH_SUMMARY,
  fetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1_000).toISOString(),
}

function makeReq(vin: string, search = ""): NextRequest {
  return new NextRequest(`http://localhost/api/v1/carfax/${vin}${search}`, {
    method: "GET",
    headers: { "x-forwarded-for": "1.2.3.4" },
  })
}

const ctx = (vin: string) => ({ params: Promise.resolve({ vin }) })

beforeEach(() => {
  vi.clearAllMocks()
  rateLimitMock.mockResolvedValue({ success: true, remaining: 30 })
  readCarfaxEnvMock.mockReturnValue(FIXTURE_ENV)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("GET /api/v1/carfax/[vin]", () => {
  it("returns 400 for an invalid VIN (no rate-limit / cache call)", async () => {
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq("BAD-VIN"), ctx("BAD-VIN"))
    expect(res.status).toBe(400)
    expect(getCachedSummaryMock).not.toHaveBeenCalled()
  })

  it("returns 429 when rate-limited", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0 })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(429)
  })

  it("returns enabled:false when the env is missing", async () => {
    readCarfaxEnvMock.mockReturnValueOnce(null)
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.enabled).toBe(false)
    expect(fetchBadgesMock).not.toHaveBeenCalled()
  })

  it("serves the cache hit on a fresh row (no live fetch)", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("cache")
    expect(body.summary.vin).toBe(FIXTURE_VIN)
    expect(fetchBadgesMock).not.toHaveBeenCalled()
  })

  it("forces a live fetch with ?force=true even when cache is fresh", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    fetchBadgesMock.mockResolvedValueOnce({
      ok: true,
      value: { ...FRESH_SUMMARY, reportNumber: 9999 },
    })
    upsertSummaryMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN, "?force=true"), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("live")
    expect(fetchBadgesMock).toHaveBeenCalledTimes(1)
    expect(upsertSummaryMock).toHaveBeenCalledTimes(1)
  })

  it("falls through to live when no cache row exists, then upserts", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: null })
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("live")
    expect(upsertSummaryMock).toHaveBeenCalledTimes(1)
  })

  it("falls through to live when cache row is stale, then upserts", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: STALE_SUMMARY })
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("live")
  })

  it("serves stale-fallback when live fetch fails AND a cache row exists", async () => {
    getCachedSummaryMock.mockResolvedValue({ ok: true, value: STALE_SUMMARY })
    fetchBadgesMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: "http-error", status: 502, body: "bad gateway" },
    })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("stale-fallback")
  })

  it("returns 502 when live fetch fails AND no cache row exists", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: null })
    fetchBadgesMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: "network", message: "ECONNRESET" },
    })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error.code).toBe("CARFAX_UNAVAILABLE")
  })

  it("returns the live summary even if UPSERT fails (degrades gracefully)", async () => {
    getCachedSummaryMock.mockResolvedValueOnce({ ok: true, value: null })
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FRESH_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: "db-error", message: "rls" },
    })
    const { GET } = await import("@/app/api/v1/carfax/[vin]/route")
    const res = await GET(makeReq(FIXTURE_VIN), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe("live")
  })
})
