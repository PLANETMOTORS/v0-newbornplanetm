import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  getSupabaseAnonKey,
  getSupabasePooledUrl,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/config"

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
})

describe("lib/supabase/config getSupabaseUrl", () => {
  it("prefers NEXT_PUBLIC_SUPABASE_URL when set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co"
    process.env.SUPABASE_URL = "https://server.supabase.co"
    expect(getSupabaseUrl()).toBe("https://public.supabase.co")
  })

  it("falls back to SUPABASE_URL when only the server-side var is set", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co"
    expect(getSupabaseUrl()).toBe("https://server.supabase.co")
  })

  it("returns undefined when neither var is set", () => {
    expect(getSupabaseUrl()).toBeUndefined()
  })

  it("treats an empty-string env as unset (returns undefined)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_URL = ""
    expect(getSupabaseUrl()).toBeUndefined()
  })
})

describe("lib/supabase/config getSupabasePooledUrl", () => {
  it("appends ?pgbouncer=true to a clean URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    expect(getSupabasePooledUrl()).toBe("https://abc.supabase.co/?pgbouncer=true")
  })

  it("appends ?pgbouncer=true to an HTTP URL with an existing path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co/db"
    expect(getSupabasePooledUrl()).toBe("https://abc.supabase.co/db?pgbouncer=true")
  })

  it("preserves other query params and overrides any existing pgbouncer", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co/?foo=bar&pgbouncer=false"
    const out = getSupabasePooledUrl() ?? ""
    expect(out).toContain("foo=bar")
    expect(out).toContain("pgbouncer=true")
    expect(out).not.toContain("pgbouncer=false")
  })

  it("returns undefined when the base URL is missing", () => {
    expect(getSupabasePooledUrl()).toBeUndefined()
  })

  it("returns undefined when the base URL is malformed", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not a url"
    expect(getSupabasePooledUrl()).toBeUndefined()
  })

  it("falls back to SUPABASE_URL when public is unset", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co"
    expect(getSupabasePooledUrl()).toBe("https://server.supabase.co/?pgbouncer=true")
  })
})

describe("lib/supabase/config getSupabaseAnonKey", () => {
  it("reads NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    expect(getSupabaseAnonKey()).toBe("anon-123")
  })

  it("returns undefined when missing", () => {
    expect(getSupabaseAnonKey()).toBeUndefined()
  })
})

describe("lib/supabase/config getSupabaseServiceRoleKey", () => {
  it("reads SUPABASE_SERVICE_ROLE_KEY", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-456"
    expect(getSupabaseServiceRoleKey()).toBe("service-456")
  })

  it("returns undefined when missing", () => {
    expect(getSupabaseServiceRoleKey()).toBeUndefined()
  })
})
