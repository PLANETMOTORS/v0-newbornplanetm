import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockUserEmail: string | null = "admin@planetmotors.ca"
let mockMappings: Array<{
  vin: string
  mid: string
  vehicle_name: string | null
  frames_in_storage: boolean
  verified_at: string | null
}> = []
let mockFetchError: { message: string } | null = null

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

const mockSelect = vi.fn(async () => ({ data: mockMappings, error: mockFetchError }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}))

const { GET } = await import("@/app/api/v1/admin/drivee/audit/route")

describe("GET /api/v1/admin/drivee/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = "admin@planetmotors.ca"
    mockMappings = []
    mockFetchError = null
  })

  it("returns empty collisions list when every MID is unique", async () => {
    mockMappings = [
      { vin: "VIN_A", mid: "111", vehicle_name: "A", frames_in_storage: true, verified_at: null },
      { vin: "VIN_B", mid: "222", vehicle_name: "B", frames_in_storage: true, verified_at: null },
    ]
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.totalMappings).toBe(2)
    expect(body.collisionCount).toBe(0)
    expect(body.collisions).toEqual([])
  })

  it("flags MIDs that are mapped to multiple VINs (the smoking-gun case)", async () => {
    mockMappings = [
      {
        vin: "1C4JJXP6XMW777356",
        mid: "190171976531",
        vehicle_name: "2021 Jeep Wrangler 4xe Unlimited Sahara",
        frames_in_storage: true,
        verified_at: "2026-04-30T19:00:00Z",
      },
      {
        vin: "1C4JJXP60MW777382",
        mid: "190171976531",
        vehicle_name: "2021 Jeep Wrangler 4xe Unlimited Sahara",
        frames_in_storage: true,
        verified_at: "2026-04-29T12:00:00Z",
      },
      // a non-colliding mapping should not appear
      { vin: "VIN_X", mid: "999", vehicle_name: "X", frames_in_storage: true, verified_at: null },
    ]
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.collisionCount).toBe(1)
    expect(body.collisions).toHaveLength(1)
    expect(body.collisions[0].mid).toBe("190171976531")
    expect(body.collisions[0].vins).toHaveLength(2)
    const vins = body.collisions[0].vins.map((v: { vin: string }) => v.vin)
    expect(vins).toContain("1C4JJXP6XMW777356")
    expect(vins).toContain("1C4JJXP60MW777382")
  })

  it("handles three-way collisions correctly", async () => {
    mockMappings = [
      { vin: "VIN_A", mid: "555", vehicle_name: null, frames_in_storage: true, verified_at: null },
      { vin: "VIN_B", mid: "555", vehicle_name: null, frames_in_storage: true, verified_at: null },
      { vin: "VIN_C", mid: "555", vehicle_name: null, frames_in_storage: false, verified_at: null },
    ]
    const res = await GET()
    const body = await res.json()
    expect(body.collisionCount).toBe(1)
    expect(body.collisions[0].vins).toHaveLength(3)
  })

  it("ignores rows with null/empty MID", async () => {
    mockMappings = [
      { vin: "VIN_A", mid: "", vehicle_name: null, frames_in_storage: false, verified_at: null },
      { vin: "VIN_B", mid: "", vehicle_name: null, frames_in_storage: false, verified_at: null },
    ]
    const res = await GET()
    const body = await res.json()
    expect(body.collisionCount).toBe(0)
  })

  it("returns 401 when not authenticated", async () => {
    mockUserEmail = null
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns 401 when user is not in ADMIN_EMAILS", async () => {
    mockUserEmail = "stranger@example.com"
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns 500 when DB query fails", async () => {
    mockFetchError = { message: "DB exploded" }
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("returns ok=true and zero collisions when DB has no rows", async () => {
    mockMappings = []
    const res = await GET()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.totalMappings).toBe(0)
    expect(body.collisionCount).toBe(0)
  })
})
