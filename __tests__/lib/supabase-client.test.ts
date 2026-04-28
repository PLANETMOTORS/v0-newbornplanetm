import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn((url: string, key: string) => ({ __url: url, __key: key })),
}))

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
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

describe("lib/supabase/client createClient (browser)", () => {
  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    const { createClient } = await import("@/lib/supabase/client")
    expect(() => createClient()).toThrow(/Missing Supabase credentials/)
  })

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    const { createClient } = await import("@/lib/supabase/client")
    expect(() => createClient()).toThrow(/Missing Supabase credentials/)
  })

  it("throws when both are missing", async () => {
    const { createClient } = await import("@/lib/supabase/client")
    expect(() => createClient()).toThrow(/Missing Supabase credentials/)
  })

  it("returns a browser client when both env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-token"
    const { createClient } = await import("@/lib/supabase/client")
    const client = createClient() as unknown as { __url: string; __key: string }
    expect(client.__url).toBe("https://abc.supabase.co")
    expect(client.__key).toBe("anon-token")
  })
})
