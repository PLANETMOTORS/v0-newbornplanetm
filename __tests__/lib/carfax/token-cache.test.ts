import { afterEach, describe, expect, it, vi } from "vitest"
import {
  TOKEN_POLICY,
  clearCarfaxTokenCache,
  getCachedToken,
  storeToken,
} from "@/lib/carfax/token-cache"
import { FIXTURE_TOKEN } from "@/__tests__/fixtures/carfax"

const CLIENT_ID = "client-A"
const NOW = 1_750_000_000_000

afterEach(() => {
  clearCarfaxTokenCache()
  vi.useRealTimers()
})

describe("Carfax token cache", () => {
  it("returns null when nothing has been stored", () => {
    expect(getCachedToken(CLIENT_ID, NOW)).toBeNull()
  })

  it("returns the stored token while still well under TTL", () => {
    storeToken(CLIENT_ID, FIXTURE_TOKEN, NOW)
    expect(getCachedToken(CLIENT_ID, NOW + 30 * 60 * 1_000)).toBe(FIXTURE_TOKEN.access_token)
  })

  it("treats the token as stale within the policy window of expiry", () => {
    storeToken(CLIENT_ID, FIXTURE_TOKEN, NOW)
    // 10 minutes remaining < 12 minute stale window
    const tenMinutesBeforeExpiry = NOW + (FIXTURE_TOKEN.expires_in - 10 * 60) * 1_000
    expect(getCachedToken(CLIENT_ID, tenMinutesBeforeExpiry)).toBeNull()
  })

  it("returns null after the token has fully expired", () => {
    storeToken(CLIENT_ID, FIXTURE_TOKEN, NOW)
    expect(getCachedToken(CLIENT_ID, NOW + (FIXTURE_TOKEN.expires_in + 1) * 1_000)).toBeNull()
  })

  it("namespaces by client_id so two dealerships do not collide", () => {
    storeToken("dealer-A", { ...FIXTURE_TOKEN, access_token: "TOKEN-A-LONG-ENOUGH-FOR-SCHEMA" }, NOW)
    storeToken("dealer-B", { ...FIXTURE_TOKEN, access_token: "TOKEN-B-LONG-ENOUGH-FOR-SCHEMA" }, NOW)
    expect(getCachedToken("dealer-A", NOW)).toBe("TOKEN-A-LONG-ENOUGH-FOR-SCHEMA")
    expect(getCachedToken("dealer-B", NOW)).toBe("TOKEN-B-LONG-ENOUGH-FOR-SCHEMA")
  })

  it("clearCarfaxTokenCache forgets every stored token", () => {
    storeToken(CLIENT_ID, FIXTURE_TOKEN, NOW)
    clearCarfaxTokenCache()
    expect(getCachedToken(CLIENT_ID, NOW)).toBeNull()
  })

  it("uses Date.now() when nowMs is omitted", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    storeToken(CLIENT_ID, FIXTURE_TOKEN)
    expect(getCachedToken(CLIENT_ID)).toBe(FIXTURE_TOKEN.access_token)
  })

  it("exports a stale-window policy constant for observability", () => {
    expect(TOKEN_POLICY.staleAtMs).toBe(12 * 60 * 1_000)
  })
})
