import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn((url: string, key: string, options: unknown) => ({
    __url: url,
    __key: key,
    __options: options,
  })),
}))

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
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

describe("lib/supabase/admin createAdminClient", () => {
  it("throws when neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    const { createAdminClient } = await import("@/lib/supabase/admin")
    expect(() => createAdminClient()).toThrow(/SUPABASE_URL/)
  })

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    const { createAdminClient } = await import("@/lib/supabase/admin")
    expect(() => createAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it("constructs a client with auth.autoRefreshToken=false and persistSession=false", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const client = createAdminClient() as unknown as {
      __url: string
      __key: string
      __options: { auth: { autoRefreshToken: boolean; persistSession: boolean } }
    }
    expect(client.__url).toBe("https://abc.supabase.co")
    expect(client.__key).toBe("service-key")
    expect(client.__options.auth.autoRefreshToken).toBe(false)
    expect(client.__options.auth.persistSession).toBe(false)
  })

  it("falls back to SUPABASE_URL when only the server-side var is set", async () => {
    process.env.SUPABASE_URL = "https://server.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k"
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const client = createAdminClient() as unknown as { __url: string }
    expect(client.__url).toBe("https://server.supabase.co")
  })
})
