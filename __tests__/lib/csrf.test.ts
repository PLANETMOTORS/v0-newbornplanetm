import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = [
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_URL",
  "NEXT_PUBLIC_SITE_DOMAIN",
  "NODE_ENV",
] as const
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

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api", {
    method: "POST",
    headers,
  })
}

describe("validateOrigin — development bypass", () => {
  it("returns true for any origin in development", async () => {
    process.env.NODE_ENV = "development"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({}))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "https://evil.com" }))).toBe(true)
  })
})

describe("validateOrigin — production checks", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production"
  })

  it("rejects when no origin/referer header is set", async () => {
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({}))).toBe(false)
  })

  it("accepts a request whose Origin matches NEXT_PUBLIC_BASE_URL", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://planetmotors.ca" }))).toBe(true)
  })

  it("auto-adds www. variant of NEXT_PUBLIC_BASE_URL", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://www.planetmotors.ca" }))).toBe(true)
  })

  it("does NOT add a second www. when BASE_URL already starts with www.", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://www.planetmotors.ca" }))).toBe(true)
  })

  it("rejects untrusted origins", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://evil.com" }))).toBe(false)
  })

  it("uses Referer when Origin is missing", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(
      validateOrigin(makeRequest({ referer: "https://planetmotors.ca/some/page?utm=x" })),
    ).toBe(true)
  })

  it("rejects untrusted Referer when Origin is missing", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ referer: "https://attacker.com/x" }))).toBe(false)
  })

  it("VERCEL_URL is added to allowed origins", async () => {
    process.env.VERCEL_URL = "preview-abc.vercel.app"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://preview-abc.vercel.app" }))).toBe(true)
  })

  it("NEXT_PUBLIC_VERCEL_URL is added to allowed origins as fallback", async () => {
    process.env.NEXT_PUBLIC_VERCEL_URL = "preview-xyz.vercel.app"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://preview-xyz.vercel.app" }))).toBe(true)
  })

  it("NEXT_PUBLIC_SITE_DOMAIN allows comma-separated multiple domains", async () => {
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "planetmotors.ca,planetmotors.com,foo.bar"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://planetmotors.ca" }))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "https://www.planetmotors.com" }))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "https://foo.bar" }))).toBe(true)
  })

  it("ignores empty entries within NEXT_PUBLIC_SITE_DOMAIN list", async () => {
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "planetmotors.ca, , ,"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://planetmotors.ca" }))).toBe(true)
  })

  it("does NOT double-add www. when SITE_DOMAIN already starts with www.", async () => {
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "www.planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://www.planetmotors.ca" }))).toBe(true)
  })

  it("does NOT add www. when SITE_DOMAIN contains ://www.", async () => {
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "https://www.example.com"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://www.example.com" }))).toBe(true)
  })

  it("handles unparseable SITE_DOMAIN entry gracefully", async () => {
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "@@invalid@@"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://anything.com" }))).toBe(false)
  })

  it("ignores malformed VERCEL_URL", async () => {
    process.env.VERCEL_URL = "@@malformed@@"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://anything.com" }))).toBe(false)
  })

  it("handles completely unparseable BASE_URL gracefully", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "://"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "https://example.com" }))).toBe(false)
  })

  it("does NOT include localhost origins in production", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://planetmotors.ca"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "http://localhost:3000" }))).toBe(false)
  })
})

describe("validateOrigin — non-production (test) includes localhost", () => {
  it("accepts localhost variants when NODE_ENV is 'test'", async () => {
    process.env.NODE_ENV = "test"
    const { validateOrigin } = await import("@/lib/csrf")
    expect(validateOrigin(makeRequest({ origin: "http://localhost:3000" }))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "http://127.0.0.1:3000" }))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "http://localhost:3001" }))).toBe(true)
    expect(validateOrigin(makeRequest({ origin: "http://127.0.0.1:3001" }))).toBe(true)
  })
})
