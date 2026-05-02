import { describe, it, expect, vi, beforeEach } from "vitest"

// next/headers + next/server scaffolding
vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockUserEmail: string | null = "admin@planetmotors.ca"
let mockExistingRow: Record<string, unknown> | null = null
let mockFetchError: { message: string } | null = null
let mockUpdateError: { message: string } | null = null
let mockDeleteError: { message: string } | null = null
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

vi.mock("@/lib/admin-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-auth")>()
  return { ...actual }
})

vi.mock("@/lib/drivee-db", () => ({
  invalidateDriveeCache: invalidateSpy,
}))

// createAdminClient returns a chain that supports
//  - .from().select().eq().maybeSingle()
//  - .from().update().eq()
//  - .from().delete().eq()
const mockUpdateEq = vi.fn(async () => ({ error: mockUpdateError }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockDeleteEq = vi.fn(async () => ({ error: mockDeleteError }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockMaybeSingle = vi.fn(async () => ({ data: mockExistingRow, error: mockFetchError }))
const mockSelectEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate, delete: mockDelete }))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}))

const { PATCH, GET, DELETE: DELETE_HANDLER } = await import(
  "@/app/api/v1/admin/drivee/[vin]/route"
)

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/admin/drivee/1HGCM82633A123456", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function getRequest(): Request {
  return new Request("http://localhost/api/v1/admin/drivee/1HGCM82633A123456", { method: "GET" })
}

const VIN = "1HGCM82633A123456"
const params = Promise.resolve({ vin: VIN })

describe("PATCH /api/v1/admin/drivee/[vin]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = "admin@planetmotors.ca"
    mockExistingRow = {
      vin: VIN,
      mid: "33490",
      frame_count: 24,
      frames_in_storage: true,
      vehicle_name: "2021 Jeep Wrangler 4xe Unlimited Sahara",
    }
    mockFetchError = null
    mockUpdateError = null
  })

  it("disables 360° (sets frames_in_storage=false) and invalidates cache", async () => {
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.framesInStorage).toBe(false)
    expect(body.mid).toBe("33490")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ frames_in_storage: false }),
    )
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it("re-enables 360° (sets frames_in_storage=true) when starting from disabled state", async () => {
    mockExistingRow = { ...mockExistingRow, frames_in_storage: false } as Record<string, unknown>
    const res = await PATCH(patchRequest({ disabled: false }) as never, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.framesInStorage).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ frames_in_storage: true }),
    )
  })

  it("is idempotent: same-state request returns 200 with no DB write", async () => {
    // Already enabled, asking to enable
    const res = await PATCH(patchRequest({ disabled: false }) as never, { params })
    expect(res.status).toBe(200)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it("returns 401 when caller is not authenticated", async () => {
    mockUserEmail = null
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(401)
  })

  it("returns 401 when caller is not in ADMIN_EMAILS", async () => {
    mockUserEmail = "stranger@example.com"
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(401)
  })

  it("returns 400 when VIN length is wrong", async () => {
    const res = await PATCH(
      patchRequest({ disabled: true }) as never,
      { params: Promise.resolve({ vin: "TOOSHORT" }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/17/)
  })

  it("returns 400 when body is not valid JSON", async () => {
    const badRequest = new Request("http://localhost/api/v1/admin/drivee/" + VIN, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const res = await PATCH(badRequest as never, { params })
    expect(res.status).toBe(400)
  })

  it("returns 400 when `disabled` field is missing", async () => {
    const res = await PATCH(patchRequest({}) as never, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/disabled/)
  })

  it("returns 400 when `disabled` field is non-boolean", async () => {
    const res = await PATCH(patchRequest({ disabled: "yes" }) as never, { params })
    expect(res.status).toBe(400)
  })

  it("returns 404 when no drivee_mappings row exists for that VIN", async () => {
    mockExistingRow = null
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(404)
  })

  it("returns 500 when fetching mapping fails", async () => {
    mockFetchError = { message: "DB exploded" }
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(500)
  })

  it("returns 500 when update fails", async () => {
    mockUpdateError = { message: "Constraint violation" }
    const res = await PATCH(patchRequest({ disabled: true }) as never, { params })
    expect(res.status).toBe(500)
  })
})

describe("GET /api/v1/admin/drivee/[vin]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = "admin@planetmotors.ca"
    mockExistingRow = {
      vin: VIN,
      mid: "33490",
      frame_count: 24,
      frames_in_storage: true,
      vehicle_name: "2021 Jeep Wrangler 4xe Unlimited Sahara",
      source: "pirelly",
      verified_at: "2026-04-30T19:15:00Z",
      updated_at: "2026-04-30T19:15:00Z",
    }
    mockFetchError = null
  })

  it("returns the mapping for a valid VIN", async () => {
    const res = await GET(getRequest() as never, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.mapping.mid).toBe("33490")
  })

  it("returns 401 when not admin", async () => {
    mockUserEmail = null
    const res = await GET(getRequest() as never, { params })
    expect(res.status).toBe(401)
  })

  it("returns 404 when row missing", async () => {
    mockExistingRow = null
    const res = await GET(getRequest() as never, { params })
    expect(res.status).toBe(404)
  })

  it("returns 400 on bad VIN", async () => {
    const res = await GET(
      getRequest() as never,
      { params: Promise.resolve({ vin: "BAD" }) },
    )
    expect(res.status).toBe(400)
  })
})

function deleteRequest(): Request {
  return new Request("http://localhost/api/v1/admin/drivee/" + VIN, { method: "DELETE" })
}

describe("DELETE /api/v1/admin/drivee/[vin]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = "admin@planetmotors.ca"
    mockExistingRow = {
      vin: VIN,
      mid: "190171976531",
      vehicle_name: "2021 Jeep Wrangler 4xe Unlimited Sahara",
    }
    mockFetchError = null
    mockDeleteError = null
  })

  it("hard-deletes the row, invalidates cache, returns deleted row", async () => {
    const res = await DELETE_HANDLER(deleteRequest() as never, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.deleted.mid).toBe("190171976531")
    expect(body.deleted.vin).toBe(VIN)
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it("returns 401 when not admin", async () => {
    mockUserEmail = null
    const res = await DELETE_HANDLER(deleteRequest() as never, { params })
    expect(res.status).toBe(401)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("returns 400 on bad VIN", async () => {
    const res = await DELETE_HANDLER(
      deleteRequest() as never,
      { params: Promise.resolve({ vin: "TOOSHORT" }) },
    )
    expect(res.status).toBe(400)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("returns 404 when no row exists", async () => {
    mockExistingRow = null
    const res = await DELETE_HANDLER(deleteRequest() as never, { params })
    expect(res.status).toBe(404)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("returns 500 when fetch fails", async () => {
    mockFetchError = { message: "DB unreachable" }
    const res = await DELETE_HANDLER(deleteRequest() as never, { params })
    expect(res.status).toBe(500)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("returns 500 when delete fails", async () => {
    mockDeleteError = { message: "constraint violation" }
    const res = await DELETE_HANDLER(deleteRequest() as never, { params })
    expect(res.status).toBe(500)
  })
})
