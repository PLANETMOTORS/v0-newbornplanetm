import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clearCarfaxTokenCache,
  getCachedToken,
  storeToken,
} from "@/lib/carfax/token-cache"
import type { CarfaxToken } from "@/lib/carfax/schemas"

const FRESH_TOKEN: CarfaxToken = {
  access_token: "eyJhbGc-fresh-token-VALUE-LONG-ENOUGH",
  scope: "list:vhr:badges:company",
  expires_in: 7200,
  token_type: "Bearer",
}

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
    storeToken(CLIENT_ID, FRESH_TOKEN, NOW)
    // 30 minutes after issue — well within renewal window
    expect(getCachedToken(CLIENT_ID, NOW + 30 * 60 * 1_000)).toBe(FRESH_TOKEN.access_token)
  })

  it("treats the token as stale within 12 minutes of expiry (90% rule)", () => {
    storeToken(CLIENT_ID, FRESH_TOKEN, NOW)
    // 1h 50m later — 10 minutes remaining (< 12 min stale window)
    const tenMinutesBeforeExpiry = NOW + (FRESH_TOKEN.expires_in - 10 * 60) * 1_000
    expect(getCachedToken(CLIENT_ID, tenMinutesBeforeExpiry)).toBeNull()
  })

  it("returns null after the token has fully expired", () => {
    storeToken(CLIENT_ID, FRESH_TOKEN, NOW)
    expect(getCachedToken(CLIENT_ID, NOW + (FRESH_TOKEN.expires_in + 1) * 1_000)).toBeNull()
  })

  it("namespaces by client_id so two dealerships do not collide", () => {
    storeToken("dealer-A", { ...FRESH_TOKEN, access_token: "TOKEN-A-LONG-ENOUGH-FOR-SCHEMA" }, NOW)
    storeToken("dealer-B", { ...FRESH_TOKEN, access_token: "TOKEN-B-LONG-ENOUGH-FOR-SCHEMA" }, NOW)
    expect(getCachedToken("dealer-A", NOW)).toBe("TOKEN-A-LONG-ENOUGH-FOR-SCHEMA")
    expect(getCachedToken("dealer-B", NOW)).toBe("TOKEN-B-LONG-ENOUGH-FOR-SCHEMA")
  })

  it("clearCarfaxTokenCache forgets every stored token", () => {
    storeToken(CLIENT_ID, FRESH_TOKEN, NOW)
    clearCarfaxTokenCache()
    expect(getCachedToken(CLIENT_ID, NOW)).toBeNull()
  })

  it("uses Date.now() when nowMs is omitted", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    storeToken(CLIENT_ID, FRESH_TOKEN)
    expect(getCachedToken(CLIENT_ID)).toBe(FRESH_TOKEN.access_token)
  })
})
