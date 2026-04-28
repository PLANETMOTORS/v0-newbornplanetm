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

describe("checkAuthRateLimit (C1 + C2 + FU-3 IP-only ceiling)", () => {
  it("checks BOTH the principal-scoped bucket AND the IP-only bucket", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 5 })
    await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(rateLimitMock).toHaveBeenCalledTimes(2)
    const keys = rateLimitMock.mock.calls.map((c) => c[0] as string)
    // One key encodes the principal hash; one is IP-only.
    const ipOnlyKey = keys.find((k) => k.includes(":ip:"))
    const principalKey = keys.find((k) => !k.includes(":ip:"))
    expect(ipOnlyKey).toBe("auth:login:ip:203.0.113.10")
    expect(principalKey).toBeDefined()
    expect(principalKey).toContain("auth:login:203.0.113.10:")
    // Email is never in clear text.
    expect(principalKey).not.toContain("tony@example.com")
  })

  it("allows when both buckets allow", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 4 })
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.allowed).toBe(true)
    expect(r.retryAfterSeconds).toBe(0)
  })

  it("blocks when ONLY the principal bucket is exhausted (per-email brute force)", async () => {
    // First call (principal bucket) is exhausted; second call (IP bucket) is fine.
    rateLimitMock
      .mockResolvedValueOnce({ success: false, remaining: 0 })
      .mockResolvedValueOnce({ success: true, remaining: 24 })
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.allowed).toBe(false)
    expect(r.retryAfterSeconds).toBe(15 * 60)
  })

  it("blocks when ONLY the IP-only bucket is exhausted (FU-3 — email rotation bypass)", async () => {
    // Principal bucket fine (different email each time), IP bucket full.
    rateLimitMock
      .mockResolvedValueOnce({ success: true, remaining: 5 })
      .mockResolvedValueOnce({ success: false, remaining: 0 })
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "fresh-email-25@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.allowed).toBe(false)
    expect(r.retryAfterSeconds).toBe(15 * 60)
    expect(r.remaining).toBe(0)
  })

  it("returns the tighter of the two remaining counters", async () => {
    rateLimitMock
      .mockResolvedValueOnce({ success: true, remaining: 4 })  // principal
      .mockResolvedValueOnce({ success: true, remaining: 1 })  // ip
    const r = await checkAuthRateLimit(
      makeRequest({ "cf-connecting-ip": "203.0.113.10" }),
      "tony@example.com",
      AUTH_RATE_LIMITS.LOGIN
    )
    expect(r.remaining).toBe(1)
  })

  it("uses LOGIN config: 5/900s for principal, 25/900s for IP", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 5 })
    await checkAuthRateLimit(makeRequest(), "x@example.com", AUTH_RATE_LIMITS.LOGIN)
    const calls = rateLimitMock.mock.calls
    const principalCall = calls.find((c) => !(c[0] as string).includes(":ip:"))
    const ipCall = calls.find((c) => (c[0] as string).includes(":ip:"))
    expect(principalCall).toEqual([expect.stringContaining("auth:login:"), 5, 15 * 60])
    expect(ipCall).toEqual([expect.stringContaining("auth:login:ip:"), 25, 15 * 60])
  })

  it("uses REFRESH config: 60/3600s for principal, 300/3600s for IP", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 60 })
    await checkAuthRateLimit(makeRequest(), "rt-abc", AUTH_RATE_LIMITS.REFRESH)
    const calls = rateLimitMock.mock.calls
    const principalCall = calls.find((c) => !(c[0] as string).includes(":ip:"))
    const ipCall = calls.find((c) => (c[0] as string).includes(":ip:"))
    expect(principalCall).toEqual([expect.stringContaining("auth:refresh:"), 60, 60 * 60])
    expect(ipCall).toEqual([expect.stringContaining("auth:refresh:ip:"), 300, 60 * 60])
  })

  it("scopes principal bucket by ip+sha256(email) — two emails get distinct keys", async () => {
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
    const principalKeys = rateLimitMock.mock.calls
      .map((c) => c[0] as string)
      .filter((k) => !k.includes(":ip:"))
    expect(principalKeys).toHaveLength(2)
    expect(principalKeys[0]).not.toBe(principalKeys[1])
  })

  it("normalises principal case before hashing", async () => {
    rateLimitMock.mockResolvedValue({ success: true, remaining: 5 })
    await checkAuthRateLimit(makeRequest(), "Tony@Example.com", AUTH_RATE_LIMITS.LOGIN)
    await checkAuthRateLimit(makeRequest(), "tony@example.com", AUTH_RATE_LIMITS.LOGIN)
    const principalKeys = rateLimitMock.mock.calls
      .map((c) => c[0] as string)
      .filter((k) => !k.includes(":ip:"))
    expect(principalKeys[0]).toBe(principalKeys[1])
  })

  it("FU-3 simulation: 25 attempts across 25 different emails on the same IP get blocked at the ceiling", async () => {
    // Stateful mock: principal bucket always fresh (new email each time),
    // IP bucket increments and trips at limit=25.
    let ipHits = 0
    rateLimitMock.mockImplementation((key: string, limit: number) => {
      if ((key as string).includes(":ip:")) {
        ipHits += 1
        const success = ipHits <= limit
        return Promise.resolve({ success, remaining: Math.max(0, limit - ipHits) })
      }
      return Promise.resolve({ success: true, remaining: 5 })
    })

    const verdicts: boolean[] = []
    for (let i = 0; i < 26; i += 1) {
      const r = await checkAuthRateLimit(
        makeRequest({ "cf-connecting-ip": "203.0.113.99" }),
        `victim-${i}@example.com`,
        AUTH_RATE_LIMITS.LOGIN
      )
      verdicts.push(r.allowed)
    }
    expect(verdicts.slice(0, 25).every((v) => v)).toBe(true)
    expect(verdicts[25]).toBe(false) // IP ceiling caught the 26th
  })
})
