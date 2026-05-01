import { afterEach, beforeEach, describe, expect, it } from "vitest"

const ORIGINAL = { ...process.env }

const VALID = {
  CARFAX_AUTH_URL: "https://authentication.carfax.ca/oauth/token",
  CARFAX_API_URL: "https://badgingapi.carfax.ca/api/v3",
  CARFAX_AUDIENCE: "https://api.carfax.ca",
  CARFAX_CLIENT_ID: "abc12345",
  CARFAX_CLIENT_SECRET: "this-is-a-long-enough-secret-1234",
  CARFAX_ACCOUNT_NUMBER: "00000",
}

beforeEach(() => {
  for (const k of Object.keys(VALID)) {
    delete (process.env as Record<string, string | undefined>)[k]
  }
})

afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe("readCarfaxEnv", () => {
  it("returns the parsed object when every var is present and valid", async () => {
    Object.assign(process.env, VALID)
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toEqual(VALID)
  })

  it("returns null when any var is missing", async () => {
    Object.assign(process.env, { ...VALID, CARFAX_CLIENT_ID: undefined })
    delete (process.env as Record<string, string | undefined>).CARFAX_CLIENT_ID
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when a var is the empty string", async () => {
    Object.assign(process.env, { ...VALID, CARFAX_CLIENT_SECRET: "" })
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when account number is non-numeric", async () => {
    Object.assign(process.env, { ...VALID, CARFAX_ACCOUNT_NUMBER: "ABC123" })
    const { readCarfaxEnv } = await import("@/lib/carfax/env")
    expect(readCarfaxEnv()).toBeNull()
  })

  it("returns null when auth URL is not a URL", async () => {
    Object.assign(process.env, { ...VALID, CARFAX_AUTH_URL: "not-a-url" })
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
    Object.assign(process.env, VALID)
    const { requireCarfaxEnv } = await import("@/lib/carfax/env")
    expect(requireCarfaxEnv()).toEqual(VALID)
  })
})
