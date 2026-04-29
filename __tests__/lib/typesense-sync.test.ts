import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────────────────

const sanityFetchMock = vi.fn(async (_q: string, _params?: unknown) => null as unknown)
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { fetch: (q: string, p?: unknown) => sanityFetchMock(q, p) },
}))

const isConfigured = vi.fn(() => true)

const upsertMock = vi.fn(async (_doc: unknown) => undefined)
const deleteMock = vi.fn(async () => undefined)
const getAdminClient = vi.fn(() => ({
  collections: () => ({
    documents: (id?: string) => (
      id ? { delete: () => deleteMock() } : { upsert: (d: unknown) => upsertMock(d) }
    ),
  }),
}))

vi.mock("@/lib/typesense/client", () => ({
  isTypesenseConfigured: () => isConfigured(),
  getAdminClient: () => getAdminClient(),
  VEHICLES_COLLECTION: "vehicles",
}))

vi.mock("@/lib/typesense/indexer", () => ({
  normalizeBodyStyle: (s: string) => `norm:${s.toLowerCase()}`,
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

beforeEach(() => {
  sanityFetchMock.mockReset()
  upsertMock.mockReset()
  deleteMock.mockReset()
  getAdminClient.mockReset()
  isConfigured.mockReset()
  isConfigured.mockReturnValue(true)
  getAdminClient.mockImplementation(() => ({
    collections: () => ({
      documents: (id?: string) => (
        id ? { delete: () => deleteMock() } : { upsert: (d: unknown) => upsertMock(d) }
      ),
    }),
  }))
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("lib/typesense/sync syncVehicleToTypesense — config gates", () => {
  it("returns 'skipped_not_configured' when Typesense is not configured", async () => {
    isConfigured.mockReturnValue(false)
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v1", "create")
    expect(out).toEqual({ success: true, action: "skipped_not_configured" })
  })

  it("returns 'skipped_no_client' when admin client is unavailable", async () => {
    getAdminClient.mockReturnValue(null as unknown as ReturnType<typeof getAdminClient>)
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v1", "create")
    expect(out.success).toBe(false)
    expect(out.action).toBe("skipped_no_client")
  })
})

describe("lib/typesense/sync — delete operation", () => {
  it("deletes the document when operation === 'delete'", async () => {
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("doc-1", "delete")
    expect(deleteMock).toHaveBeenCalled()
    expect(out).toEqual({ success: true, action: "deleted" })
  })

  it("treats a 404 as success ('deleted_not_found')", async () => {
    deleteMock.mockRejectedValueOnce({ httpStatus: 404, message: "not found" })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("doc-2", "delete")
    expect(out).toEqual({ success: true, action: "deleted_not_found" })
  })

  it("returns 'delete_failed' for other errors (Error instance)", async () => {
    deleteMock.mockRejectedValueOnce(new Error("network"))
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("doc-3", "delete")
    expect(out.success).toBe(false)
    expect(out.action).toBe("delete_failed")
    expect(out.error).toBe("network")
  })

  it("stringifies non-Error throwables for delete failures", async () => {
    deleteMock.mockRejectedValueOnce("string-error")
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("doc-4", "delete")
    expect(out.success).toBe(false)
    expect(out.error).toBe("string-error")
  })
})

describe("lib/typesense/sync — upsert (create / update)", () => {
  it("returns 'sanity_fetch_failed' when Sanity throws", async () => {
    sanityFetchMock.mockRejectedValueOnce(new Error("sanity 500"))
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v-fail", "create")
    expect(out.success).toBe(false)
    expect(out.action).toBe("sanity_fetch_failed")
    expect(out.error).toBe("sanity 500")
  })

  it("returns 'skipped_not_published' when Sanity returns null", async () => {
    sanityFetchMock.mockResolvedValueOnce(null)
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v-draft", "update")
    expect(out).toEqual({ success: true, action: "skipped_not_published" })
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it("upserts the mapped document when Sanity returns a vehicle", async () => {
    sanityFetchMock.mockResolvedValueOnce({
      _id: "abc",
      year: 2023,
      make: "Tesla",
      model: "Model 3",
      trim: "LR",
      vin: "VIN1",
      stockNumber: "S1",
      price: 30000,
      specialPrice: 29000,
      mileage: 12345,
      bodyStyle: "Sedan",
      fuelType: "Electric",
      transmission: "Auto",
      drivetrain: "AWD",
      engine: "EV",
      description: "nice",
      mainImage: "https://img/main.jpg",
      _createdAt: "2026-01-01T00:00:00.000Z",
    })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("abc", "create")
    expect(out).toEqual({ success: true, action: "upserted" })
    expect(upsertMock).toHaveBeenCalledTimes(1)
    const doc = upsertMock.mock.calls[0][0] as Record<string, unknown>
    expect(doc.id).toBe("abc")
    expect(doc.price).toBe(2_900_000) // specialPrice in cents (29000 * 100)
    expect(doc.is_ev).toBe(true) // fuelType matches /electric/i
    expect(doc.body_style).toBe("norm:sedan") // mocked normalizeBodyStyle
    expect(doc.created_at).toBe(Math.floor(new Date("2026-01-01T00:00:00.000Z").getTime() / 1000))
    expect(doc.is_certified).toBe(false)
    expect(doc.status).toBe("available")
  })

  it("falls back to price (not specialPrice) when specialPrice is undefined", async () => {
    sanityFetchMock.mockResolvedValueOnce({
      _id: "v",
      price: 25000,
      fuelType: "Gas",
    })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    await syncVehicleToTypesense("v", "create")
    const doc = upsertMock.mock.calls[0][0] as Record<string, unknown>
    expect(doc.price).toBe(2_500_000)
    expect(doc.is_ev).toBe(false)
  })

  it("uses safe defaults for empty Sanity vehicles (missing year/make/model/etc.)", async () => {
    sanityFetchMock.mockResolvedValueOnce({ _id: "x" })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    await syncVehicleToTypesense("x", "update")
    const doc = upsertMock.mock.calls[0][0] as Record<string, unknown>
    expect(doc.year).toBe(0)
    expect(doc.make).toBe("")
    expect(doc.model).toBe("")
    expect(doc.stock_number).toBe("")
    expect(doc.price).toBe(0)
    expect(doc.mileage).toBe(0)
    expect(doc.fuel_type).toBeUndefined()
    expect(doc.body_style).toBeUndefined()
    expect(doc.is_ev).toBe(false)
    expect(doc.status).toBe("available")
    expect(typeof doc.created_at).toBe("number") // falls back to Math.floor(Date.now()/1000)
  })

  it("returns 'upsert_failed' when the Typesense upsert throws (Error)", async () => {
    sanityFetchMock.mockResolvedValueOnce({ _id: "v", price: 100 })
    upsertMock.mockRejectedValueOnce(new Error("ts down"))
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v", "create")
    expect(out.success).toBe(false)
    expect(out.action).toBe("upsert_failed")
    expect(out.error).toBe("ts down")
  })

  it("stringifies non-Error throwables for upsert failures", async () => {
    sanityFetchMock.mockResolvedValueOnce({ _id: "v", price: 100 })
    upsertMock.mockRejectedValueOnce({ weird: true })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v", "create")
    expect(out.success).toBe(false)
    expect(out.action).toBe("upsert_failed")
    expect(typeof out.error).toBe("string")
  })

  it("treats unknown operations as upsert (NOT delete)", async () => {
    sanityFetchMock.mockResolvedValueOnce({ _id: "v", price: 1 })
    const { syncVehicleToTypesense } = await import("@/lib/typesense/sync")
    const out = await syncVehicleToTypesense("v", "publish")
    expect(out.action).toBe("upserted")
    expect(deleteMock).not.toHaveBeenCalled()
    expect(upsertMock).toHaveBeenCalled()
  })
})
