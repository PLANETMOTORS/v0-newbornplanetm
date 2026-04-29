/**
 * __tests__/lib/neon-sql.test.ts
 *
 * Coverage for lib/neon/sql.ts. We mock the Neon serverless driver so we can
 * assert which env var was selected and that null is returned when none is
 * configured.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const neonMock = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: neonMock,
}))

const ENV_KEYS = ["DATABASE_URL", "NEON_DATABASE_URL", "NEON_POSTGRES_URL"] as const

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

describe("lib/neon/sql.getSql", () => {
  beforeEach(() => {
    vi.resetModules()
    neonMock.mockReset()
    clearEnv()
  })

  afterEach(() => {
    clearEnv()
  })

  it("returns null when no Neon connection string is configured", async () => {
    const { getSql } = await import("@/lib/neon/sql")
    expect(getSql()).toBeNull()
    expect(neonMock).not.toHaveBeenCalled()
  })

  it("uses DATABASE_URL when set", async () => {
    process.env.DATABASE_URL = "postgres://primary"
    neonMock.mockReturnValue({ tag: "primary-client" })
    const { getSql } = await import("@/lib/neon/sql")
    const client = getSql()
    expect(neonMock).toHaveBeenCalledWith("postgres://primary")
    expect(client).toEqual({ tag: "primary-client" })
  })

  it("falls back to NEON_DATABASE_URL when DATABASE_URL is unset", async () => {
    process.env.NEON_DATABASE_URL = "postgres://neon"
    neonMock.mockReturnValue({ tag: "neon-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(neonMock).toHaveBeenCalledWith("postgres://neon")
  })

  it("falls back to NEON_POSTGRES_URL when the other two are unset", async () => {
    process.env.NEON_POSTGRES_URL = "postgres://neon-pg"
    neonMock.mockReturnValue({ tag: "neon-pg-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(neonMock).toHaveBeenCalledWith("postgres://neon-pg")
  })

  it("prefers DATABASE_URL over the Neon-specific fallbacks", async () => {
    process.env.DATABASE_URL = "postgres://primary"
    process.env.NEON_DATABASE_URL = "postgres://neon"
    process.env.NEON_POSTGRES_URL = "postgres://neon-pg"
    neonMock.mockReturnValue({ tag: "primary-client" })
    const { getSql } = await import("@/lib/neon/sql")
    getSql()
    expect(neonMock).toHaveBeenCalledOnce()
    expect(neonMock).toHaveBeenCalledWith("postgres://primary")
  })
})
