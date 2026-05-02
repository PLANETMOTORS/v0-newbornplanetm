import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
})

describe("lib/site-url getPublicSiteUrl", () => {
  it("returns the production default when neither env var is set", async () => {
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://www.planetmotors.ca")
  })

  it("normalises NEXT_PUBLIC_SITE_URL to its origin (strips path)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/some/path"
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://example.com")
  })

  it("falls back to NEXT_PUBLIC_BASE_URL when NEXT_PUBLIC_SITE_URL is unset", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://staging.planetmotors.ca/?utm=x"
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://staging.planetmotors.ca")
  })

  it("prefers NEXT_PUBLIC_SITE_URL over NEXT_PUBLIC_BASE_URL when both are set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://canon.example.com"
    process.env.NEXT_PUBLIC_BASE_URL = "https://other.example.com"
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://canon.example.com")
  })

  it("falls back to the default when env value is malformed (URL throws)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not a url"
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://www.planetmotors.ca")
  })

  it("falls back to the default when env value is empty string", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = ""
    process.env.NEXT_PUBLIC_BASE_URL = ""
    const { getPublicSiteUrl } = await import("@/lib/site-url")
    expect(getPublicSiteUrl()).toBe("https://www.planetmotors.ca")
  })
})
