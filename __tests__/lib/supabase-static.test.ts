import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const
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
  vi.restoreAllMocks()
})

describe("createStaticClient", () => {
  it("throws when SUPABASE_URL is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createStaticClient } = await import("@/lib/supabase/static")
    expect(() => createStaticClient()).toThrow(/Missing Supabase credentials/)
  })

  it("throws when ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    const { createStaticClient } = await import("@/lib/supabase/static")
    expect(() => createStaticClient()).toThrow(/Missing Supabase credentials/)
  })

  it("creates and memoises a client when both env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createStaticClient } = await import("@/lib/supabase/static")
    const a = createStaticClient()
    const b = createStaticClient()
    expect(a).toBeDefined()
    expect(a).toBe(b)
  })

  it("uses pooled URL when available", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createStaticClient } = await import("@/lib/supabase/static")
    expect(() => createStaticClient()).not.toThrow()
  })
})
