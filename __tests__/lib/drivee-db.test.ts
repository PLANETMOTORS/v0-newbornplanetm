import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface QueryResult { data: unknown; error: unknown }
let nextResult: QueryResult = { data: [], error: null }

interface ChainStub {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  then: (resolve: (v: unknown) => unknown) => Promise<unknown>
}

const lastChain: { current: ChainStub | null } = { current: null }

function makeChain(payload: QueryResult): ChainStub {
  const stub: Partial<ChainStub> = {}
  const passthrough = vi.fn(() => stub as ChainStub)
  stub.select = passthrough
  stub.eq = passthrough
  ;(stub as unknown as PromiseLike<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(payload).then(resolve)
  return stub as ChainStub
}

const fromMock = vi.fn(() => {
  lastChain.current = makeChain(nextResult)
  return lastChain.current
})

const supabaseMock = { from: fromMock }
const createStaticClientMock = vi.fn(() => supabaseMock)

vi.mock("@/lib/supabase/static", () => ({
  createStaticClient: createStaticClientMock,
}))

vi.mock("@/lib/drivee", () => ({
  DRIVEE_VIN_MAP: {
    "VIN_STATIC_1": "MID-STATIC-1",
    "VIN_STATIC_2": "MID-STATIC-2",
  },
}))

beforeEach(() => {
  nextResult = { data: [], error: null }
  fromMock.mockClear()
  createStaticClientMock.mockClear()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("drivee-db — DB happy path", () => {
  it("getDriveeMidFromDb returns mid from supabase", async () => {
    nextResult = {
      data: [
        { vin: "VIN1", mid: "MID-1", frame_count: 36, frames_in_storage: true, vehicle_name: "Tesla M3" },
      ],
      error: null,
    }
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb("VIN1")).toBe("MID-1")
    expect(createStaticClientMock).toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalledWith("drivee_mappings")
    expect(lastChain.current?.eq).toHaveBeenCalledWith("frames_in_storage", true)
  })

  it("getDriveeMidFromDb returns null for unknown VIN", async () => {
    nextResult = { data: [{ vin: "VIN1", mid: "MID-1", frame_count: 1, frames_in_storage: true, vehicle_name: null }], error: null }
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb("UNKNOWN")).toBe(null)
  })

  it("getDriveeMidFromDb returns null for null/undefined input", async () => {
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb(null)).toBe(null)
    expect(await getDriveeMidFromDb(undefined)).toBe(null)
    expect(await getDriveeMidFromDb("")).toBe(null)
  })

  it("getDriveeMappingFromDb returns full row", async () => {
    nextResult = {
      data: [
        { vin: "VIN-X", mid: "MID-X", frame_count: 36, frames_in_storage: true, vehicle_name: "X" },
      ],
      error: null,
    }
    const { getDriveeMappingFromDb } = await import("@/lib/drivee-db")
    const m = await getDriveeMappingFromDb("VIN-X")
    expect(m?.mid).toBe("MID-X")
    expect(m?.frame_count).toBe(36)
  })

  it("getDriveeMappingFromDb returns null for empty input", async () => {
    const { getDriveeMappingFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMappingFromDb(null)).toBe(null)
    expect(await getDriveeMappingFromDb("")).toBe(null)
  })

  it("getKnownMids returns set of all MIDs in storage", async () => {
    nextResult = {
      data: [
        { vin: "A", mid: "M1", frame_count: 1, frames_in_storage: true, vehicle_name: null },
        { vin: "B", mid: "M2", frame_count: 1, frames_in_storage: true, vehicle_name: null },
      ],
      error: null,
    }
    const { getKnownMids } = await import("@/lib/drivee-db")
    const mids = await getKnownMids()
    expect(mids.has("M1")).toBe(true)
    expect(mids.has("M2")).toBe(true)
    expect(mids.size).toBe(2)
  })
})

describe("drivee-db — caching", () => {
  it("caches results across repeated calls within TTL", async () => {
    nextResult = {
      data: [{ vin: "V", mid: "M", frame_count: 1, frames_in_storage: true, vehicle_name: null }],
      error: null,
    }
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    await getDriveeMidFromDb("V")
    await getDriveeMidFromDb("V")
    // Only one DB query for 2 calls within TTL
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it("invalidateDriveeCache forces a refresh on next call", async () => {
    nextResult = {
      data: [{ vin: "V", mid: "M", frame_count: 1, frames_in_storage: true, vehicle_name: null }],
      error: null,
    }
    const { getDriveeMidFromDb, invalidateDriveeCache } = await import("@/lib/drivee-db")
    await getDriveeMidFromDb("V")
    invalidateDriveeCache()
    await getDriveeMidFromDb("V")
    expect(fromMock).toHaveBeenCalledTimes(2)
  })
})

describe("drivee-db — fallback to static map", () => {
  it("falls back to DRIVEE_VIN_MAP when DB returns error", async () => {
    nextResult = { data: null, error: { message: "db down" } }
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb("VIN_STATIC_1")).toBe("MID-STATIC-1")
    expect(await getDriveeMidFromDb("VIN_STATIC_2")).toBe("MID-STATIC-2")
    expect(await getDriveeMidFromDb("VIN_NOT_IN_STATIC")).toBe(null)
  })

  it("falls back to DRIVEE_VIN_MAP when DB returns empty", async () => {
    nextResult = { data: [], error: null }
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb("VIN_STATIC_1")).toBe("MID-STATIC-1")
  })

  it("falls back when supabase client throws", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("network")
    })
    const { getDriveeMidFromDb } = await import("@/lib/drivee-db")
    expect(await getDriveeMidFromDb("VIN_STATIC_1")).toBe("MID-STATIC-1")
  })

  it("getKnownMids includes static MIDs in fallback", async () => {
    nextResult = { data: null, error: { message: "fail" } }
    const { getKnownMids } = await import("@/lib/drivee-db")
    const mids = await getKnownMids()
    expect(mids.has("MID-STATIC-1")).toBe(true)
    expect(mids.has("MID-STATIC-2")).toBe(true)
  })
})
