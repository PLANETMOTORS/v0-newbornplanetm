/**
 * Coverage for C1 + C2 — auth rate limiting.
 *
 * The Redis primitive is mocked so the test exercises the wrapper
 * behaviour (scope hashing + retryAfter calculation + fail-open default)
 * without needing an Upstash connection. Tests run in <50ms.
 */

import { afterEach, describe, expect, it, vi } from "vitest"

const rateLimitMock = vi.fn()

vi.mock("@/lib/redis", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
}))

import {
  AUTH_RATE_LIMITS,
  checkAuthRateLimit,
} from "@/lib/security/auth-rate-limit"
import { getClientIp } from "@/lib/security/client-ip"

afterEach(() => {
  rateLimitMock.mockReset()
})

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/v1/auth/login", {
    method: "POST",
    headers,
  })
}

describe("client-ip extraction", () => {
  it("prefers cf-connecting-ip", () => {
    const r = makeRequest({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "10.0.0.1",
    })
    expect(getClientIp(r)).toBe("203.0.113.10")
  })

  it("falls back to first x-forwarded-for entry", () => {
    const r = makeRequest({
      "x-forwarded-for": "203.0.113.20, 10.0.0.1, 10.0.0.2",
    })
    expect(getClientIp(r)).toBe("203.0.113.20")
  })

  it("falls back to x-real-ip", () => {
    const r = makeRequest({ "x-real-ip": "203.0.113.30" })
    expect(getClientIp(r)).toBe("203.0.113.30")
  })

  it("returns 'unknown' when no IP header is present", () => {
    expect(getClientIp(makeRequest())).toBe("unknown")
  })
})

describe("checkAuthRateLimit (C1 + C2)", () => {
  it("returns allowed=true when Redis says success", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: true, remaining: 4 })
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
    expect(r.retryAfterSeconds).toBe(0)
  })

  it("returns allowed=false with retryAfterSeconds when Redis says blocked", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0 })
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
    expect(r.retryAfterSeconds).toBe(15 * 60)
  })

  it("scopes by ip+sha256(email) so two emails on the same IP get separate buckets", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 5 })
    await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "alice@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    const keys = rateLimitMock.mock.calls.map((c) => c[0])
    expect(keys).toHaveLength(2)
    expect(keys[0]).not.toBe(keys[1])
    // Same IP visible in both keys
    expect(keys[0]).toContain("203.0.113.10")
    expect(keys[1]).toContain("203.0.113.10")
    // Email never appears in clear text
    expect(keys[0]).not.toContain("tony@example.com")
    expect(keys[1]).not.toContain("alice@example.com")
  })

  it("uses the LOGIN config for login (5 / 900s)", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: true, remaining: 5 })
    await checkAuthRateLimit(makeRequest(), "x@example.com", AUTH_RATE_LIMITS.LOGIN)
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.stringContaining("auth:login:"),
      5,
      15 * 60
    )
  })

  it("uses the REFRESH config for refresh (60 / 3600s)", async () => {
    rateLimitMock.mockResolvedValueOnce({ success: true, remaining: 60 })
    await checkAuthRateLimit(makeRequest(), "rt-abc", AUTH_RATE_LIMITS.REFRESH)
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.stringContaining("auth:refresh:"),
      60,
      60 * 60
    )
  })

  it("normalises principal case before hashing", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 5 })
    await checkAuthRateLimit(makeRequest(), "Tony@Example.com", AUTH_RATE_LIMITS.LOGIN)
    await checkAuthRateLimit(makeRequest(), "tony@example.com", AUTH_RATE_LIMITS.LOGIN)
    const k1 = rateLimitMock.mock.calls[0][0]
    const k2 = rateLimitMock.mock.calls[1][0]
    expect(k1).toBe(k2)
  })
})
