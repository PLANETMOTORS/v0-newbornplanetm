import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { verifyCronSecret } from "@/lib/security/cron-auth"

function makeRequest(authorization?: string): Request {
  const headers = new Headers()
  if (authorization) headers.set("authorization", authorization)
  return new Request("https://example.com/api/cron/test", { headers })
}

describe("verifyCronSecret", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "")
    vi.stubEnv("NODE_ENV", "test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ── Fail-closed in production ──────────────────────────────────────────

  it("returns 503 when CRON_SECRET is unset in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CRON_SECRET", "")
    const result = verifyCronSecret(makeRequest())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(503)
    }
  })

  it("returns 503 when CRON_SECRET is undefined in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.CRON_SECRET
    const result = verifyCronSecret(makeRequest())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(503)
    }
  })

  // ── Valid secret ───────────────────────────────────────────────────────

  it("returns ok when authorization header matches CRON_SECRET", () => {
    vi.stubEnv("CRON_SECRET", "my-secret-123")
    const result = verifyCronSecret(makeRequest("Bearer my-secret-123"))
    expect(result.ok).toBe(true)
  })

  // ── Invalid secret ─────────────────────────────────────────────────────

  it("returns 401 when authorization header does not match", () => {
    vi.stubEnv("CRON_SECRET", "my-secret-123")
    const result = verifyCronSecret(makeRequest("Bearer wrong-secret"))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  it("returns 401 when authorization header is missing", () => {
    vi.stubEnv("CRON_SECRET", "my-secret-123")
    const result = verifyCronSecret(makeRequest())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  it("returns 401 when authorization header is empty", () => {
    vi.stubEnv("CRON_SECRET", "my-secret-123")
    const result = verifyCronSecret(makeRequest(""))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  // ── No secret configured (non-production) ─────────────────────────────

  it("returns ok when CRON_SECRET is unset in non-production (skip check)", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("CRON_SECRET", "")
    const result = verifyCronSecret(makeRequest())
    expect(result.ok).toBe(true)
  })

  // ── Custom secret override ─────────────────────────────────────────────

  it("uses custom secret from options instead of CRON_SECRET", () => {
    vi.stubEnv("CRON_SECRET", "default-secret")
    const result = verifyCronSecret(
      makeRequest("Bearer custom-secret"),
      { secret: "custom-secret" },
    )
    expect(result.ok).toBe(true)
  })

  it("rejects when custom secret does not match", () => {
    vi.stubEnv("CRON_SECRET", "default-secret")
    const result = verifyCronSecret(
      makeRequest("Bearer default-secret"),
      { secret: "custom-secret" },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })

  it("falls back to CRON_SECRET when options.secret is undefined", () => {
    vi.stubEnv("CRON_SECRET", "my-secret-123")
    const result = verifyCronSecret(
      makeRequest("Bearer my-secret-123"),
      { secret: undefined },
    )
    expect(result.ok).toBe(true)
  })

  // ── Timing-safe (structural) ───────────────────────────────────────────

  it("rejects secrets of different length (length check before timingSafeEqual)", () => {
    vi.stubEnv("CRON_SECRET", "short")
    const result = verifyCronSecret(makeRequest("Bearer a-much-longer-secret-value"))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })
})
