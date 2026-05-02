import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface MockDocsApi {
  upsert: ReturnType<typeof vi.fn>
  import: ReturnType<typeof vi.fn>
}
interface MockSingleDoc {
  delete: ReturnType<typeof vi.fn>
}

let docsApi: MockDocsApi
let singleDoc: MockSingleDoc
let documentsFn: ReturnType<typeof vi.fn>
let collectionsFn: ReturnType<typeof vi.fn>
let mockClient: { collections: typeof collectionsFn } | null

vi.mock("@/lib/typesense/client", () => ({
  VEHICLES_COLLECTION: "vehicles",
  getAdminClient: vi.fn(() => mockClient),
}))

beforeEach(() => {
  docsApi = {
    upsert: vi.fn(async (doc: unknown) => doc),
    import: vi.fn(async (docs: unknown[]) =>
      docs.map(() => ({ success: true })),
    ),
  }
  singleDoc = { delete: vi.fn(async () => undefined) }

  documentsFn = vi.fn((id?: string) => (id ? singleDoc : docsApi)) as unknown as ReturnType<typeof vi.fn>
  collectionsFn = vi.fn(() => ({ documents: documentsFn }))
  mockClient = { collections: collectionsFn }
})

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
})

const baseDoc = {
  id: "v1",
  stock_number: "S1",
  year: 2024,
  make: "Toyota",
  model: "Camry",
  price: 2_500_000,
  mileage: 12000,
  is_ev: false,
  is_certified: true,
  status: "available",
}

describe("normalizeBodyStyle", () => {
  it.each([
    ["4dr Sport Utility Vehicle", "Sport Utility"],
    ["SUV", "Sport Utility"],
    ["4dr Car", "4dr Car"],
    ["4dr Sedan", "4dr Car"],
    ["Pickup Truck", "Pickup"],
    ["Truck", "Pickup"],
    ["Convertible", "Convertible"],
    ["Hatchback", "Hatchback"],
    ["Mini Van", "Van"],
    ["Minivan", "Van"],
    ["Wagon", "Wagon"],
    ["Coupe", "Coupe"],
    ["Coupé", "Coupe"],
  ])("normalises %s to %s", async (input, expected) => {
    const { normalizeBodyStyle } = await import("@/lib/typesense/indexer")
    expect(normalizeBodyStyle(input)).toBe(expected)
  })

  it("returns the original string when no rule matches", async () => {
    const { normalizeBodyStyle } = await import("@/lib/typesense/indexer")
    expect(normalizeBodyStyle("Roadster")).toBe("Roadster")
    expect(normalizeBodyStyle("")).toBe("")
  })
})

describe("upsertVehicle", () => {
  it("returns false when admin client is not configured", async () => {
    mockClient = null
    const { upsertVehicle } = await import("@/lib/typesense/indexer")
    expect(await upsertVehicle({ ...baseDoc })).toBe(false)
  })

  it("upserts the document and returns true on success", async () => {
    const { upsertVehicle } = await import("@/lib/typesense/indexer")
    const ok = await upsertVehicle({ ...baseDoc, body_style: "4dr Sport Utility Vehicle" })
    expect(ok).toBe(true)
    expect(collectionsFn).toHaveBeenCalledWith("vehicles")
    const arg = docsApi.upsert.mock.calls[0][0] as Record<string, unknown>
    expect(arg.body_style).toBe("Sport Utility") // normalised
  })

  it("does not normalise when body_style is undefined", async () => {
    const { upsertVehicle } = await import("@/lib/typesense/indexer")
    await upsertVehicle({ ...baseDoc })
    const arg = docsApi.upsert.mock.calls[0][0] as Record<string, unknown>
    expect(arg.body_style).toBeUndefined()
  })
})

describe("upsertVehiclesBatch", () => {
  it("returns 0/0 when admin client is not configured", async () => {
    mockClient = null
    const { upsertVehiclesBatch } = await import("@/lib/typesense/indexer")
    expect(await upsertVehiclesBatch([baseDoc])).toEqual({ success: 0, errors: 0 })
  })

  it("normalises body_style on every doc before import", async () => {
    const { upsertVehiclesBatch } = await import("@/lib/typesense/indexer")
    await upsertVehiclesBatch([
      { ...baseDoc, id: "1", body_style: "4dr Sport Utility Vehicle" },
      { ...baseDoc, id: "2", body_style: "Sedan" },
    ])
    const sent = docsApi.import.mock.calls[0][0] as Array<Record<string, unknown>>
    expect(sent[0].body_style).toBe("Sport Utility")
    expect(sent[1].body_style).toBe("4dr Car")
  })

  it("tallies success and error results", async () => {
    docsApi.import.mockResolvedValueOnce([
      { success: true },
      { success: false, error: "boom" },
      { success: true },
    ])
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { upsertVehiclesBatch } = await import("@/lib/typesense/indexer")
    const result = await upsertVehiclesBatch([baseDoc, baseDoc, baseDoc])
    expect(result).toEqual({ success: 2, errors: 1 })
    expect(errSpy).toHaveBeenCalled()
  })

  it("splits docs into multiple batches when count exceeds batchSize", async () => {
    const docs = Array.from({ length: 251 }, (_, i) => ({ ...baseDoc, id: `v${i}` }))
    const { upsertVehiclesBatch } = await import("@/lib/typesense/indexer")
    const result = await upsertVehiclesBatch(docs, 250)
    expect(docsApi.import).toHaveBeenCalledTimes(2)
    expect((docsApi.import.mock.calls[0][0] as unknown[]).length).toBe(250)
    expect((docsApi.import.mock.calls[1][0] as unknown[]).length).toBe(1)
    expect(result.success).toBe(251)
  })

  it("uses a custom batchSize", async () => {
    const docs = Array.from({ length: 5 }, (_, i) => ({ ...baseDoc, id: `v${i}` }))
    const { upsertVehiclesBatch } = await import("@/lib/typesense/indexer")
    await upsertVehiclesBatch(docs, 2)
    expect(docsApi.import).toHaveBeenCalledTimes(3)
  })
})

describe("deleteVehicle", () => {
  it("returns false when admin client is not configured", async () => {
    mockClient = null
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    expect(await deleteVehicle("v1")).toBe(false)
  })

  it("returns true on successful delete", async () => {
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    expect(await deleteVehicle("v1")).toBe(true)
    expect(documentsFn).toHaveBeenCalledWith("v1")
    expect(singleDoc.delete).toHaveBeenCalled()
  })

  it("treats httpStatus=404 as a successful delete (already gone)", async () => {
    singleDoc.delete.mockRejectedValueOnce({ httpStatus: 404, message: "missing" })
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    expect(await deleteVehicle("v1")).toBe(true)
  })

  it("re-throws non-404 errors", async () => {
    singleDoc.delete.mockRejectedValueOnce({ httpStatus: 500, message: "boom" })
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    await expect(deleteVehicle("v1")).rejects.toMatchObject({ httpStatus: 500 })
  })

  it("re-throws non-object error values", async () => {
    singleDoc.delete.mockRejectedValueOnce("network down")
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    await expect(deleteVehicle("v1")).rejects.toBe("network down")
  })

  it("re-throws errors that lack httpStatus", async () => {
    singleDoc.delete.mockRejectedValueOnce({ message: "no status" })
    const { deleteVehicle } = await import("@/lib/typesense/indexer")
    await expect(deleteVehicle("v1")).rejects.toMatchObject({ message: "no status" })
  })
})
