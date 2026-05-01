import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { errorResponse, gateVinAndEnv } from "@/lib/carfax/route-helpers"
import { FIXTURE_ENV, FIXTURE_VIN } from "@/__tests__/fixtures/carfax"

const ORIGINAL = { ...process.env }

beforeEach(() => {
  for (const k of Object.keys(FIXTURE_ENV)) {
    delete (process.env as Record<string, string | undefined>)[k]
  }
})

afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe("gateVinAndEnv", () => {
  it("returns ok with normalised VIN + env when both are valid", () => {
    Object.assign(process.env, FIXTURE_ENV)
    const r = gateVinAndEnv(`  ${FIXTURE_VIN.toLowerCase()}  `)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.vin).toBe(FIXTURE_VIN)
      expect(r.value.env.CARFAX_CLIENT_ID).toBe(FIXTURE_ENV.CARFAX_CLIENT_ID)
    }
  })

  it("returns 400 INVALID_VIN for malformed VINs", async () => {
    Object.assign(process.env, FIXTURE_ENV)
    const r = gateVinAndEnv("BAD-VIN")
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(400)
      const body = await r.response.json()
      expect(body.error.code).toBe("INVALID_VIN")
    }
  })

  it("returns 503 CARFAX_DISABLED when env is missing", async () => {
    const r = gateVinAndEnv(FIXTURE_VIN)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(503)
      const body = await r.response.json()
      expect(body.error.code).toBe("CARFAX_DISABLED")
    }
  })
})

describe("errorResponse", () => {
  it("returns a NextResponse with the supplied code, message, and status", async () => {
    const res = errorResponse("RATE_LIMITED", "too many", 429)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error.code).toBe("RATE_LIMITED")
    expect(body.error.message).toBe("too many")
  })

  it("merges extra fields onto error", async () => {
    const res = errorResponse("CARFAX_UNAVAILABLE", "down", 502, { kind: "timeout" })
    const body = await res.json()
    expect(body.error.kind).toBe("timeout")
  })
})
