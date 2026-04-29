import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const createSupabaseClientMock = vi.fn(() => ({ id: "client-1" }))

vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string) => createSupabaseClientMock(url, key),
}))

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  createSupabaseClientMock.mockClear()
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
})

describe("createStaticClient", () => {
  it("creates a client when both env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    const { createStaticClient } = await import("@/lib/supabase/static")
    const c = createStaticClient()
    expect(c).toBeDefined()
    expect(createSupabaseClientMock).toHaveBeenCalledTimes(1)
    // first arg should be the pooled URL (with pgbouncer query param) since both env vars are present
    expect(String(createSupabaseClientMock.mock.calls[0][0])).toMatch(/pgbouncer=true/)
    expect(createSupabaseClientMock.mock.calls[0][1]).toBe("anon")
  })

  it("memoises the client across repeated calls", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    const { createStaticClient } = await import("@/lib/supabase/static")
    const a = createStaticClient()
    const b = createStaticClient()
    expect(a).toBe(b)
    expect(createSupabaseClientMock).toHaveBeenCalledTimes(1)
  })

  it("falls back to non-pooled URL when pooled URL fails to construct", async () => {
    // Set malformed URL — getSupabasePooledUrl will return undefined,
    // then getSupabaseUrl returns the same string and the function uses it.
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    const { createStaticClient } = await import("@/lib/supabase/static")
    createStaticClient()
    expect(createSupabaseClientMock).toHaveBeenCalledWith("not-a-url", "anon")
  })

  it("throws a descriptive error when URL is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    const { createStaticClient } = await import("@/lib/supabase/static")
    expect(() => createStaticClient()).toThrow(/Missing Supabase credentials/)
  })

  it("throws when anon key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    const { createStaticClient } = await import("@/lib/supabase/static")
    expect(() => createStaticClient()).toThrow(/Missing Supabase credentials/)
  })
})
