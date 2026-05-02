import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const TRACKED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
  "ADMIN_EMAIL",
  "AUTORAPTOR_ADF_ENDPOINT",
  "KV_REST_API_URL",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
] as const
type TrackedKey = (typeof TRACKED_KEYS)[number]
const original: Partial<Record<TrackedKey, string | undefined>> = {}

beforeEach(() => {
  for (const k of TRACKED_KEYS) original[k] = process.env[k]
  // Set required vars to valid values by default
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "proj"
  process.env.NEXT_PUBLIC_SANITY_DATASET = "dataset"
  vi.resetModules()
})

afterEach(() => {
  for (const k of TRACKED_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

describe("env proxy — happy path", () => {
  it("returns required values lazily on first access", async () => {
    const { env } = await import("@/lib/env")
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co")
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key")
  })

  it("returns optional values when set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123"
    process.env.RESEND_API_KEY = "re_test"
    const { env } = await import("@/lib/env")
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_123")
    expect(env.RESEND_API_KEY).toBe("re_test")
  })

  it("returns undefined for unset optional values", async () => {
    delete process.env.STRIPE_SECRET_KEY
    const { env } = await import("@/lib/env")
    expect(env.STRIPE_SECRET_KEY).toBeUndefined()
  })

  it("caches validation result across multiple accesses", async () => {
    const { env } = await import("@/lib/env")
    const a = env.NEXT_PUBLIC_SUPABASE_URL
    const b = env.NEXT_PUBLIC_SUPABASE_URL
    expect(a).toBe(b)
    // Even if env changes after first access, cached value is returned
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://other.supabase.co"
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co")
  })

  it("supports email-shaped optional ADMIN_EMAIL", async () => {
    process.env.ADMIN_EMAIL = "admin@example.com"
    const { env } = await import("@/lib/env")
    expect(env.ADMIN_EMAIL).toBe("admin@example.com")
  })

  it("supports url-shaped optional AUTORAPTOR_ADF_ENDPOINT", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const { env } = await import("@/lib/env")
    expect(env.AUTORAPTOR_ADF_ENDPOINT).toBe("https://crm.example.com/adf")
  })

  it("supports url-shaped optional KV_REST_API_URL", async () => {
    process.env.KV_REST_API_URL = "https://kv.example.com"
    const { env } = await import("@/lib/env")
    expect(env.KV_REST_API_URL).toBe("https://kv.example.com")
  })

  it("returns NEXT_PUBLIC_* client variables", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-1234"
    const { env } = await import("@/lib/env")
    expect(env.NEXT_PUBLIC_GA_MEASUREMENT_ID).toBe("G-1234")
  })
})

describe("env proxy — validation failures", () => {
  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.NEXT_PUBLIC_SUPABASE_URL).toThrow(/Missing or invalid environment variables/)
    expect(errSpy).toHaveBeenCalled()
  })

  it("throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not a url"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.NEXT_PUBLIC_SUPABASE_URL).toThrow()
  })

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ""
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toThrow()
  })

  it("throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing", async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.NEXT_PUBLIC_SANITY_PROJECT_ID).toThrow()
  })

  it("throws when ADMIN_EMAIL is set to an invalid email", async () => {
    process.env.ADMIN_EMAIL = "not-an-email"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.ADMIN_EMAIL).toThrow()
  })

  it("throws when KV_REST_API_URL is malformed", async () => {
    process.env.KV_REST_API_URL = "not a url"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { env } = await import("@/lib/env")
    expect(() => env.KV_REST_API_URL).toThrow()
  })
})
