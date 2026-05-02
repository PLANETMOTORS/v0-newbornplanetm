/**
 * __tests__/lib/neon-sql.test.ts
 *
 * Coverage for lib/neon/sql.ts. We mock the postgres.js driver so we can
 * assert which env var was selected, what options were passed, and that
 * null is returned when none is configured.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const postgresMock = vi.hoisted(() => vi.fn())

vi.mock("postgres", () => ({
  default: postgresMock,
}))

const ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
] as const

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

const EXPECTED_OPTS = expect.objectContaining({
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

describe("lib/neon/sql.getSql", () => {
  beforeEach(() => {
    vi.resetModules()
    postgresMock.mockReset()
    clearEnv()
  })

  afterEach(() => {
    clearEnv()
  })

  it("returns null when no Postgres connection string is configured", async () => {
    const { getSql } = await import("@/lib/neon/sql")
    expect(getSql()).toBeNull()
    expect(postgresMock).not.toHaveBeenCalled()
  })

  it("uses DATABASE_URL when set", async () => {
    process.env.DATABASE_URL = "postgres://primary"
    postgresMock.mockReturnValue({ tag: "primary-client" })
    const { getSql } = await import("@/lib/neon/sql")
    const client = getSql()
    expect(postgresMock).toHaveBeenCalledWith("postgres://primary", EXPECTED_OPTS)
    expect(client).toEqual({ tag: "primary-client" })
  })

  it("falls back to POSTGRES_URL (Supabase) when DATABASE_URL is unset", async () => {
    process.env.POSTGRES_URL = "postgres://supabase"
    postgresMock.mockReturnValue({ tag: "supabase-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(postgresMock).toHaveBeenCalledWith("postgres://supabase", EXPECTED_OPTS)
  })

  it("falls back to NEON_DATABASE_URL when DATABASE_URL and POSTGRES_URL are unset", async () => {
    process.env.NEON_DATABASE_URL = "postgres://neon"
    postgresMock.mockReturnValue({ tag: "neon-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(postgresMock).toHaveBeenCalledWith("postgres://neon", EXPECTED_OPTS)
  })

  it("falls back to NEON_POSTGRES_URL when the other three are unset", async () => {
    process.env.NEON_POSTGRES_URL = "postgres://neon-pg"
    postgresMock.mockReturnValue({ tag: "neon-pg-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(postgresMock).toHaveBeenCalledWith("postgres://neon-pg", EXPECTED_OPTS)
  })

  it("prefers DATABASE_URL over every fallback", async () => {
    process.env.DATABASE_URL = "postgres://primary"
    process.env.POSTGRES_URL = "postgres://supabase"
    process.env.NEON_DATABASE_URL = "postgres://neon"
    process.env.NEON_POSTGRES_URL = "postgres://neon-pg"
    postgresMock.mockReturnValue({ tag: "primary-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(postgresMock).toHaveBeenCalledOnce()
    expect(postgresMock).toHaveBeenCalledWith("postgres://primary", EXPECTED_OPTS)
  })

  it("prefers POSTGRES_URL (Supabase) over Neon fallbacks", async () => {
    process.env.POSTGRES_URL = "postgres://supabase"
    process.env.NEON_DATABASE_URL = "postgres://neon"
    process.env.NEON_POSTGRES_URL = "postgres://neon-pg"
    postgresMock.mockReturnValue({ tag: "supabase-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(postgresMock).toHaveBeenCalledOnce()
    expect(postgresMock).toHaveBeenCalledWith("postgres://supabase", EXPECTED_OPTS)
  })

  it("disables prepared statements (Supabase tx-pooler requirement)", async () => {
    process.env.DATABASE_URL = "postgres://primary"
    postgresMock.mockReturnValue({ tag: "client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    const opts = postgresMock.mock.calls[0]?.[1]
    expect(opts.prepare).toBe(false)
  })
})
