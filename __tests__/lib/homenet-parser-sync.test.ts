/**
 * Tests for syncVehiclesToDatabase — covers the inventory-floor safety
 * guard, the empty-array guard, and the SyncVehiclesResult contract.
 *
 * (Material-change detection itself lives in the SQL layer — the
 * `WHERE (...) IS DISTINCT FROM (...)` clause on the upsert — so these
 * tests focus on the application-level safety layer added on top.)
 *
 * The Neon SQL tag is mocked with a programmable handler. We branch on
 * the literal fragments of the template-literal call so each test can
 * configure exactly which query returns what without coupling to query
 * order.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { SyncVehiclesResult } from "@/lib/homenet/parser"

// ---------------------------------------------------------------------------
// SQL mock — Neon-style sql`...` tagged template
// ---------------------------------------------------------------------------

type SqlResponse = unknown[]
type SqlHandler = (strings: TemplateStringsArray, values: unknown[]) => SqlResponse

let sqlHandler: SqlHandler = () => []
const sqlCalls: Array<{ kind: string; values: unknown[] }> = []

function makeSqlMock(): (strings: TemplateStringsArray, ...values: unknown[]) => Promise<SqlResponse> {
  return async (strings, ...values) => {
    sqlCalls.push({ kind: classifyQuery(strings), values })
    return sqlHandler(strings, values)
  }
}

function classifyQuery(strings: TemplateStringsArray): string {
  const joined = strings.join(" ").toLowerCase()
  if (joined.includes("select count(*)")) return "live_count"
  if (joined.includes("insert into vehicles")) return "upsert"
  if (joined.includes("update vehicles") && joined.includes("status = 'sold'")) return "soft_delete"
  return "unknown"
}

// ---------------------------------------------------------------------------
// VehicleData factory — only the fields the sync function reads
// ---------------------------------------------------------------------------

function makeVehicle(overrides: Record<string, unknown> = {}): import("@/lib/homenet/parser").VehicleData {
  return {
    stock_number: "S1",
    vin: "1HGCM82633A123456",
    slug: "test-slug",
    title: "2023 Test Car",
    dealer_id: "planet-motors",
    source_system: "homenet",
    year: 2023,
    make: "Test",
    model: "Car",
    condition: "used",
    mileage_km: 10000,
    status: "available",
    availability_bucket: "live",
    is_certified: false,
    is_featured: false,
    price: 25000,
    mileage: 10000,
    ...overrides,
  } as import("@/lib/homenet/parser").VehicleData
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  sqlCalls.length = 0
  sqlHandler = () => []
  delete process.env.HOMENET_INVENTORY_FLOOR_PCT
  vi.spyOn(console, "info").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ===========================================================================
// __testing__.getInventoryFloorPct
// ===========================================================================

describe("__testing__.getInventoryFloorPct", () => {
  it("returns the default when env var is unset", async () => {
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(__testing__.DEFAULT_INVENTORY_FLOOR_PCT)
  })

  it("reads numeric env override", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "75"
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(75)
  })

  it("accepts a fractional value", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "12.5"
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(12.5)
  })

  it("falls back to default when env var is non-numeric", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "abc"
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(__testing__.DEFAULT_INVENTORY_FLOOR_PCT)
  })

  it("falls back when value is negative", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "-10"
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(__testing__.DEFAULT_INVENTORY_FLOOR_PCT)
  })

  it("falls back when value is above 100", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "150"
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.getInventoryFloorPct()).toBe(__testing__.DEFAULT_INVENTORY_FLOOR_PCT)
  })

  it("default is exactly 50", async () => {
    const { __testing__ } = await import("@/lib/homenet/parser")
    expect(__testing__.DEFAULT_INVENTORY_FLOOR_PCT).toBe(50)
  })
})

// ===========================================================================
// syncVehiclesToDatabase — inventory-floor safety guard
// ===========================================================================

describe("syncVehiclesToDatabase — inventory-floor safety guard", () => {
  it("ABORTS soft-delete when incoming size drops below the floor", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    // 80 incoming vehicles, but DB has 5,000 live → 80 < 2,500 floor.
    const incoming = Array.from({ length: 80 }, (_, i) =>
      makeVehicle({ vin: `VIN-${String(i).padStart(4, "0")}`, stock_number: `S-${i}` }),
    )

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 5000 }]
      return []
    }

    const result: SyncVehiclesResult = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(true)
    expect(result.removed).toBe(0)
    expect(result.soldVehicleIds).toEqual([])
    expect(sqlCalls.some((c) => c.kind === "soft_delete")).toBe(false)
    expect(result.safetyContext).toEqual({
      incoming: 80,
      currentLive: 5000,
      floorPct: 50,
      minimumExpected: 2500,
    })
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SAFETY ABORT"),
    )
  })

  it("PROCEEDS with soft-delete when incoming size is at/above the floor", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = Array.from({ length: 4900 }, (_, i) =>
      makeVehicle({ vin: `VIN-${String(i).padStart(4, "0")}`, stock_number: `S-${i}` }),
    )

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 5000 }]
      if (kind === "soft_delete") return [{ id: "sold-1" }, { id: "sold-2" }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(false)
    expect(sqlCalls.some((c) => c.kind === "soft_delete")).toBe(true)
    expect(result.removed).toBe(2)
    expect(result.soldVehicleIds).toEqual(["sold-1", "sold-2"])
  })

  it("respects HOMENET_INVENTORY_FLOOR_PCT override (e.g. 80%)", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "80"
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = Array.from({ length: 3500 }, (_, i) =>
      makeVehicle({ vin: `VIN-${String(i).padStart(4, "0")}`, stock_number: `S-${i}` }),
    )

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 5000 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    // 3500 < 4000 floor → abort.
    expect(result.safetyAborted).toBe(true)
    expect(result.safetyContext?.floorPct).toBe(80)
    expect(result.safetyContext?.minimumExpected).toBe(4000)
  })

  it("first-run / empty-DB case: no floor check is applied (currentLive=0)", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = [makeVehicle()]

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-fresh", inserted: true }]
      if (kind === "live_count") return [{ live_count: 0 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(false)
    expect(result.insertedVehicleIds).toEqual(["id-fresh"])
  })

  it("setting floor to 0 disables the guard entirely", async () => {
    process.env.HOMENET_INVENTORY_FLOOR_PCT = "0"
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = [makeVehicle()] // 1 incoming, 5000 live

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 5000 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(false)
    expect(sqlCalls.some((c) => c.kind === "soft_delete")).toBe(true)
  })

  it("falls back to NOT applying the guard when the live-count query fails", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = [makeVehicle()]

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") throw new Error("live count blew up")
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(false)
    expect(sqlCalls.some((c) => c.kind === "soft_delete")).toBe(true)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Live-count query failed"),
      expect.any(Error),
    )
  })

  it("safetyContext is undefined on a normal (non-aborted) run", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = [makeVehicle()]

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 1 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.safetyAborted).toBe(false)
    expect(result.safetyContext).toBeUndefined()
  })
})

// ===========================================================================
// syncVehiclesToDatabase — empty-array guard
// ===========================================================================

describe("syncVehiclesToDatabase — empty-array guard", () => {
  it("never runs the soft-delete or live-count queries when incoming is empty", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")

    sqlHandler = () => []

    const result = await syncVehiclesToDatabase(makeSqlMock(), [])
    expect(sqlCalls.length).toBe(0)
    expect(result.removed).toBe(0)
    expect(result.soldVehicleIds).toEqual([])
    expect(result.safetyAborted).toBe(false)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping soft-delete step"),
    )
  })
})

// ===========================================================================
// syncVehiclesToDatabase — SyncVehiclesResult contract
// ===========================================================================

describe("syncVehiclesToDatabase — SyncVehiclesResult contract", () => {
  it("returns insertedVehicleIds for new VINs", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const v = makeVehicle()

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-NEW", inserted: true }]
      if (kind === "live_count") return [{ live_count: 0 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), [v])
    expect(result.insertedVehicleIds).toEqual(["id-NEW"])
    expect(result.updatedVehicleIds).toEqual([])
    expect(result.inserted).toBe(1)
    expect(result.updated).toBe(0)
  })

  it("returns updatedVehicleIds when the upsert returns a row with inserted=false", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const v = makeVehicle()

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      // The SQL-level WHERE IS DISTINCT FROM clause gates whether the row
      // is returned — this test simulates the database deciding "yes, this
      // row materially changed, returning it".
      if (kind === "upsert") return [{ id: "id-CHANGED", inserted: false }]
      if (kind === "live_count") return [{ live_count: 1 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), [v])
    expect(result.updatedVehicleIds).toEqual(["id-CHANGED"])
    expect(result.updated).toBe(1)
    expect(result.inserted).toBe(0)
  })

  it("does NOT count unchanged rows (upsert returned no rows due to WHERE IS DISTINCT FROM)", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const v = makeVehicle()

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [] // SQL guard prevented the update
      if (kind === "live_count") return [{ live_count: 1 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), [v])
    expect(result.updatedVehicleIds).toEqual([])
    expect(result.updated).toBe(0)
    expect(result.inserted).toBe(0)
  })

  it("collects per-VIN errors without aborting the whole sync", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const a = makeVehicle({ vin: "VIN-OK", stock_number: "S-OK" })
    const b = makeVehicle({ vin: "VIN-FAIL", stock_number: "S-FAIL" })

    let upsertCallCount = 0
    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") {
        upsertCallCount += 1
        if (upsertCallCount === 2) throw new Error("constraint violation")
        return [{ id: "id-OK", inserted: true }]
      }
      if (kind === "live_count") return [{ live_count: 0 }]
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), [a, b])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].vin).toBe("VIN-FAIL")
    expect(result.inserted).toBe(1)
  })
})

// ===========================================================================
// syncVehiclesToDatabase — soft-delete error handling
// ===========================================================================

describe("syncVehiclesToDatabase — soft-delete error handling", () => {
  it("captures soft-delete failures as a BULK_SOFT_DELETE error without aborting", async () => {
    const { syncVehiclesToDatabase } = await import("@/lib/homenet/parser")
    const incoming = [makeVehicle()]

    sqlHandler = (strings) => {
      const kind = classifyQuery(strings)
      if (kind === "upsert") return [{ id: "id-x", inserted: true }]
      if (kind === "live_count") return [{ live_count: 1 }]
      if (kind === "soft_delete") throw new Error("delete failed")
      return []
    }

    const result = await syncVehiclesToDatabase(makeSqlMock(), incoming)
    expect(result.errors).toEqual([
      { vin: "BULK_SOFT_DELETE", error: "delete failed" },
    ])
    expect(result.removed).toBe(0)
  })
})
