import { describe, it, expect } from "vitest"
import { proxyBadgeUrl } from "@/lib/carfax/proxy-url"

describe("proxyBadgeUrl", () => {
  it("rewrites a cdn.carfax.ca URL to the local badge proxy", () => {
    const cdn = "https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree.svg"
    const result = proxyBadgeUrl(cdn)
    expect(result).toBe(`/api/v1/carfax/badge?url=${encodeURIComponent(cdn)}`)
  })

  it("returns non-carfax URLs unchanged", () => {
    const other = "https://example.com/badge.svg"
    expect(proxyBadgeUrl(other)).toBe(other)
  })

  it("returns empty string as-is", () => {
    expect(proxyBadgeUrl("")).toBe("")
  })
})
