/**
 * __tests__/lib/seo-indexnow.test.ts
 *
 * Coverage for lib/seo/indexnow.ts. We mock global `fetch` and the
 * `lib/site-url` resolver so the suite exercises every branch in the
 * public surface (`isIndexNowConfigured`, `buildVehicleUrls`,
 * `pingIndexNow`) plus all internal URL-normalisation paths.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const KEY_ENV = "INDEXNOW_KEY"
const SITE_URL_ENV = "NEXT_PUBLIC_SITE_URL"
const BASE_URL_ENV = "NEXT_PUBLIC_BASE_URL"

const ENV_KEYS = [KEY_ENV, SITE_URL_ENV, BASE_URL_ENV] as const

function clearEnv(): void {
  for (const k of ENV_KEYS) delete process.env[k]
}

function withResponse(status: number, ok: boolean = status >= 200 && status < 300): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("", { status, statusText: ok ? "OK" : "ERR" })
  )
}

describe("lib/seo/indexnow", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    clearEnv()
    process.env[SITE_URL_ENV] = "https://www.planetmotors.ca"
  })

  afterEach(() => {
    clearEnv()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // isIndexNowConfigured
  // ───────────────────────────────────────────────────────────────────────────
  describe("isIndexNowConfigured", () => {
    it("returns false when INDEXNOW_KEY is unset", async () => {
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(false)
    })

    it("returns false when INDEXNOW_KEY is shorter than the minimum length", async () => {
      process.env[KEY_ENV] = "short"
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(false)
    })

    it("returns false when INDEXNOW_KEY exceeds 128 characters", async () => {
      process.env[KEY_ENV] = "a".repeat(129)
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(false)
    })

    it("returns false when INDEXNOW_KEY contains non-alphanumeric characters", async () => {
      process.env[KEY_ENV] = "abc-def_12"
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(false)
    })

    it("returns true when INDEXNOW_KEY meets the minimum length", async () => {
      process.env[KEY_ENV] = "abcdef12"
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(true)
    })

    it("returns true when INDEXNOW_KEY is exactly 128 alphanumeric characters", async () => {
      process.env[KEY_ENV] = "a".repeat(128)
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.isIndexNowConfigured()).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // buildVehicleUrls
  // ───────────────────────────────────────────────────────────────────────────
  describe("buildVehicleUrls", () => {
    it("returns an empty array when no IDs are provided", async () => {
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.buildVehicleUrls([])).toEqual([])
    })

    it("anchors IDs to the public site URL", async () => {
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.buildVehicleUrls(["abc", "def"])).toEqual([
        "https://www.planetmotors.ca/vehicles/abc",
        "https://www.planetmotors.ca/vehicles/def",
      ])
    })

    it("falls back to the default site URL when none is configured", async () => {
      delete process.env[SITE_URL_ENV]
      delete process.env[BASE_URL_ENV]
      const mod = await import("@/lib/seo/indexnow")
      expect(mod.buildVehicleUrls(["abc"])).toEqual([
        "https://www.planetmotors.ca/vehicles/abc",
      ])
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // pingIndexNow
  // ───────────────────────────────────────────────────────────────────────────
  describe("pingIndexNow", () => {
    it("no-ops when INDEXNOW_KEY is not configured", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const mod = await import("@/lib/seo/indexnow")

      const result = await mod.pingIndexNow(["/inventory"])

      expect(result.ok).toBe(false)
      expect(result.status).toBe(0)
      expect(result.count).toBe(0)
      expect(result.error).toContain("not configured")
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns ok with count 0 when the urls array is empty", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const mod = await import("@/lib/seo/indexnow")

      const result = await mod.pingIndexNow([])

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)
      expect(result.count).toBe(0)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("filters out cross-host URLs and unparsable entries", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(200)

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow([
        "/inventory",
        "https://www.planetmotors.ca/vehicles/abc",
        "https://evil.example.com/spam",
        "",
        "vehicles/def",
      ])

      expect(result.ok).toBe(true)
      expect(result.count).toBe(3)

      const fetchSpy = vi.mocked(globalThis.fetch)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [, init] = fetchSpy.mock.calls[0]
      const body = JSON.parse(String((init as RequestInit).body))
      expect(body.host).toBe("www.planetmotors.ca")
      expect(body.key).toBe("abcdef1234567890")
      expect(body.keyLocation).toBe(
        "https://www.planetmotors.ca/abcdef1234567890.txt"
      )
      expect(body.urlList).toEqual([
        "https://www.planetmotors.ca/inventory",
        "https://www.planetmotors.ca/vehicles/abc",
        "https://www.planetmotors.ca/vehicles/def",
      ])
    })

    it("returns ok:false when every URL is filtered out as off-host", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const mod = await import("@/lib/seo/indexnow")

      const result = await mod.pingIndexNow([
        "https://other.example.com/a",
        "https://another.example.com/b",
      ])

      expect(result.ok).toBe(false)
      expect(result.error).toContain("no valid URLs")
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("propagates non-2xx HTTP statuses as errors", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(422, false)

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow(["/inventory"])

      expect(result.ok).toBe(false)
      expect(result.status).toBe(422)
      expect(result.count).toBe(1)
      expect(result.error).toBe("HTTP 422")
    })

    it("returns ok on a 200 response", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(200)

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow(["/inventory"])

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)
      expect(result.count).toBe(1)
    })

    it("captures network failures without throwing", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"))

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow(["/inventory"])

      expect(result.ok).toBe(false)
      expect(result.status).toBe(0)
      expect(result.error).toBe("network down")
    })

    it("falls back to a generic message when a non-Error is thrown", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      vi.spyOn(globalThis, "fetch").mockRejectedValue("boom")

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow(["/inventory"])

      expect(result.ok).toBe(false)
      expect(result.error).toBe("unknown error")
    })

    it("caps requests at 10,000 URLs per the IndexNow spec", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(200)

      const inputs = Array.from(
        { length: 10_500 },
        (_, i) => `/vehicles/${i.toString(16)}`
      )

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingIndexNow(inputs)

      expect(result.count).toBe(10_000)

      const fetchSpy = vi.mocked(globalThis.fetch)
      const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body))
      expect(body.urlList).toHaveLength(10_000)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // pingVehicleChange — admin-route helper
  // ───────────────────────────────────────────────────────────────────────────
  describe("pingVehicleChange", () => {
    it("no-ops when INDEXNOW_KEY is not configured", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const mod = await import("@/lib/seo/indexnow")

      const result = await mod.pingVehicleChange("vehicle-abc")

      expect(result.ok).toBe(false)
      expect(result.status).toBe(0)
      expect(result.count).toBe(0)
      expect(result.error).toContain("not configured")
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("pings both the VDP URL and the inventory listing in one batch", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(200)

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingVehicleChange("vehicle-abc")

      expect(result.ok).toBe(true)
      expect(result.count).toBe(2)

      const fetchSpy = vi.mocked(globalThis.fetch)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body))
      expect(body.urlList).toEqual([
        "https://www.planetmotors.ca/vehicles/vehicle-abc",
        "https://www.planetmotors.ca/inventory",
      ])
    })

    it("propagates upstream errors without throwing", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("upstream blew up"))

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingVehicleChange("vehicle-abc")

      expect(result.ok).toBe(false)
      expect(result.error).toBe("upstream blew up")
    })

    it("propagates HTTP failures with the correct count", async () => {
      process.env[KEY_ENV] = "abcdef1234567890"
      withResponse(429, false)

      const mod = await import("@/lib/seo/indexnow")
      const result = await mod.pingVehicleChange("vehicle-abc")

      expect(result.ok).toBe(false)
      expect(result.status).toBe(429)
      expect(result.count).toBe(2)
      expect(result.error).toBe("HTTP 429")
    })
  })
})
