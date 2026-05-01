import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { FIXTURE_ENV } from "@/__tests__/fixtures/carfax"

const ORIGINAL = { ...process.env }

beforeEach(() => {
  for (const k of Object.keys(FIXTURE_ENV)) {
    delete (process.env as Record<string, string | undefined>)[k]
  }
})

afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe("readCarfaxEnv", () => {
  it("returns the parsed object when every var is present and valid", async () => {
    Object.assign(process.env, FIXTURE_ENV)
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toEqual(FIXTURE_ENV)
  })

  it("returns null when any var is missing", async () => {
    Object.assign(process.env, FIXTURE_ENV)
    delete (process.env as Record<string, string | undefined>).CARFAX_CLIENT_ID
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when a var is the empty string", async () => {
    Object.assign(process.env, { ...FIXTURE_ENV, CARFAX_CLIENT_SECRET: "" })
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when account number is non-numeric", async () => {
    Object.assign(process.env, { ...FIXTURE_ENV, CARFAX_ACCOUNT_NUMBER: "ABC123" })
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when auth URL is not a URL", async () => {
    Object.assign(process.env, { ...FIXTURE_ENV, CARFAX_AUTH_URL: "not-a-url" })
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })
})

describe("requireCarfaxEnv", () => {
  it("throws on missing config (cron jobs need fail-loud)", async () => {
    const { requireCarfaxEnv } = await import("@/lib/carfax/env")
    expect(() => requireCarfaxEnv()).toThrow(/Carfax env/)
  })

  it("returns the env object on success", async () => {
    Object.assign(process.env, FIXTURE_ENV)
    const { requireCarfaxEnv } = await import("@/lib/carfax/env")
    expect(requireCarfaxEnv()).toEqual(FIXTURE_ENV)
  })
})
