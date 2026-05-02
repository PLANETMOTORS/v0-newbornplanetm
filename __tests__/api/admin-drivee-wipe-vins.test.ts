import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockUserEmail: string | null = "admin@planetmotors.ca"
const invalidateSpy = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUserEmail ? { email: mockUserEmail } : null },
      })),
    },
  })),
}))

vi.mock("@/lib/admin", () => ({
  ADMIN_EMAILS: ["admin@planetmotors.ca"],
}))

vi.mock("@/lib/drivee-db", () => ({
  invalidateDriveeCache: invalidateSpy,
}))

// Mock state, keyed by VIN, with separate state per table
type RowSnapshot = Record<string, unknown> | null
const tableState: {
  drivee_mappings: Map<string, RowSnapshot>
  vehicles: Map<string, RowSnapshot>
  errors: { table: string; vin: string; on: "delete" }[]
} = {
  drivee_mappings: new Map(),
  vehicles: new Map(),
  errors: [],
}

function buildAdminClient() {
  return {
    from: (table: "drivee_mappings" | "vehicles") => ({
      select: (_cols: string) => ({
        eq: (_col: string, vin: string) => ({
          maybeSingle: async () => {
            const data = tableState[table].get(vin) ?? null
            return { data, error: null }
          },
        }),
      }),
      delete: () => ({
        eq: async (_col: string, vin: string) => {
          const errMatch = tableState.errors.find(
            (e) => e.table === table && e.vin === vin && e.on === "delete",
          )
          if (errMatch) return { error: { message: `simulated ${table} delete failure` } }
          tableState[table].delete(vin)
          return { error: null }
        },
      }),
    }),
  }
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => buildAdminClient()),
}))

const { POST } = await import("@/app/api/v1/admin/drivee/wipe-vins/route")

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/admin/drivee/wipe-vins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VIN_RED = "1C4JJXP6XMW777356"
const VIN_GRANITE = "1C4JJXP60MW777382"

describe("POST /api/v1/admin/drivee/wipe-vins", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = "admin@planetmotors.ca"
    tableState.drivee_mappings.clear()
    tableState.vehicles.clear()
    tableState.errors = []

    // Seed the smoking-gun case: both Jeeps share MID 190171976531
    tableState.drivee_mappings.set(VIN_RED, { vin: VIN_RED, mid: "190171976531" })
    tableState.drivee_mappings.set(VIN_GRANITE, { vin: VIN_GRANITE, mid: "190171976531" })
    tableState.vehicles.set(VIN_RED, {
      vin: VIN_RED,
      year: 2021,
      make: "Jeep",
      model: "Wrangler 4xe",
    })
    tableState.vehicles.set(VIN_GRANITE, {
      vin: VIN_GRANITE,
      year: 2021,
      make: "Jeep",
      model: "Wrangler 4xe",
    })
  })

  it("wipes both rows for both VINs in one shot (smoking-gun fix)", async () => {
    const res = await POST(
      postRequest({ vins: [VIN_RED, VIN_GRANITE] }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.summary).toEqual({
      requested: 2,
      vehiclesDeleted: 2,
      mappingsDeleted: 2,
      errors: 0,
    })
    expect(body.byVin).toHaveLength(2)
    expect(tableState.drivee_mappings.size).toBe(0)
    expect(tableState.vehicles.size).toBe(0)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it("is idempotent — wiping already-empty rows reports 0 deletions, no error", async () => {
    tableState.drivee_mappings.delete(VIN_RED)
    tableState.vehicles.delete(VIN_RED)
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.summary.vehiclesDeleted).toBe(0)
    expect(body.summary.mappingsDeleted).toBe(0)
    expect(body.summary.errors).toBe(0)
  })

  it("handles VIN with mapping but no vehicle row (legacy data)", async () => {
    tableState.vehicles.delete(VIN_RED)
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    const body = await res.json()
    expect(body.summary.mappingsDeleted).toBe(1)
    expect(body.summary.vehiclesDeleted).toBe(0)
    expect(body.byVin[0].mappingPrev?.mid).toBe("190171976531")
    expect(body.byVin[0].vehiclePrev).toBeUndefined()
  })

  it("handles VIN with vehicle row but no mapping (HomeNet-only vehicle)", async () => {
    tableState.drivee_mappings.delete(VIN_RED)
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    const body = await res.json()
    expect(body.summary.vehiclesDeleted).toBe(1)
    expect(body.summary.mappingsDeleted).toBe(0)
  })

  it("returns 401 when not authenticated", async () => {
    mockUserEmail = null
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    expect(res.status).toBe(401)
  })

  it("returns 401 when not in ADMIN_EMAILS", async () => {
    mockUserEmail = "stranger@example.com"
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 on invalid JSON", async () => {
    const bad = new Request("http://localhost/api/v1/admin/drivee/wipe-vins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const res = await POST(bad as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when `vins` is missing", async () => {
    const res = await POST(postRequest({}) as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when `vins` is empty array", async () => {
    const res = await POST(postRequest({ vins: [] }) as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when a VIN is wrong length", async () => {
    const res = await POST(postRequest({ vins: ["TOOSHORT"] }) as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when a VIN is non-string", async () => {
    const res = await POST(postRequest({ vins: [12345] }) as never)
    expect(res.status).toBe(400)
  })

  it("rejects more than 50 VINs at once", async () => {
    const tooMany = Array.from({ length: 51 }, (_, i) =>
      `1C4JJXP6XMW77735${(i % 10).toString()}AAA`.slice(0, 17),
    )
    const res = await POST(postRequest({ vins: tooMany }) as never)
    expect(res.status).toBe(400)
  })

  it("reports error per-VIN when delete fails, but continues with rest", async () => {
    tableState.errors.push({ table: "vehicles", vin: VIN_RED, on: "delete" })
    const res = await POST(
      postRequest({ vins: [VIN_RED, VIN_GRANITE] }) as never,
    )
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.summary.errors).toBe(1)
    expect(body.summary.vehiclesDeleted).toBe(1) // granite still got deleted
    const redResult = body.byVin.find((r: { vin: string }) => r.vin === VIN_RED)
    expect(redResult.error).toMatch(/vehicles:/)
  })

  it("invalidates the drivee cache exactly once per call", async () => {
    await POST(postRequest({ vins: [VIN_RED, VIN_GRANITE] }) as never)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it("returns nextSteps array with operator instructions", async () => {
    const res = await POST(postRequest({ vins: [VIN_RED] }) as never)
    const body = await res.json()
    expect(Array.isArray(body.nextSteps)).toBe(true)
    expect(body.nextSteps.length).toBeGreaterThan(0)
  })
})
