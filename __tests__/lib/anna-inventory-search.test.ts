import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface QueryStub {
  in: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  then: (resolve: (v: unknown) => void) => Promise<unknown>
  // The thenable resolves with this payload
  __payload: { data: unknown; count: number | null }
}

let lastQuery: QueryStub | null
let nextPayload: { data: unknown; count: number | null }

function makeQueryStub(payload: { data: unknown; count: number | null }): QueryStub {
  const stub: Partial<QueryStub> = { __payload: payload }
  // Each chain method returns the same stub; the final await yields the payload.
  const passthrough = vi.fn(() => stub as QueryStub)
  stub.in = passthrough
  stub.order = passthrough
  stub.limit = passthrough
  stub.ilike = passthrough
  stub.lte = passthrough
  stub.gte = passthrough
  stub.eq = passthrough
  // Make it awaitable
  ;(stub as unknown as PromiseLike<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(payload).then(resolve)
  return stub as QueryStub
}

const fromMock = vi.fn(() => {
  lastQuery = makeQueryStub(nextPayload)
  // return an object whose .select() returns the same chainable stub
  return {
    select: vi.fn(() => lastQuery as QueryStub),
  }
})

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: fromMock })),
}))

beforeEach(() => {
  nextPayload = { data: [], count: 0 }
  lastQuery = null
  fromMock.mockClear()
})

afterEach(() => {
  vi.resetModules()
})

describe("searchInventory", () => {
  it("returns vehicles + count from supabase", async () => {
    const vehicles = [
      {
        id: "1",
        stock_number: "S1",
        year: 2024,
        make: "Toyota",
        model: "Camry",
        trim: "LE",
        price: 28000,
        mileage: 12000,
        exterior_color: "white",
        fuel_type: "gas",
        drivetrain: "FWD",
        status: "available",
        is_ev: false,
        primary_image_url: null,
      },
    ]
    nextPayload = { data: vehicles, count: 42 }
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    const r = await searchInventory({})
    expect(r.vehicles).toEqual(vehicles)
    expect(r.totalCount).toBe(42)
  })

  it("returns empty array when supabase returns null data", async () => {
    nextPayload = { data: null, count: null }
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    const r = await searchInventory({})
    expect(r.vehicles).toEqual([])
    expect(r.totalCount).toBe(0)
  })

  it("uses default limit of 5 when not provided", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({})
    expect(lastQuery?.limit).toHaveBeenCalledWith(5)
  })

  it("respects a custom limit", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ limit: 10 })
    expect(lastQuery?.limit).toHaveBeenCalledWith(10)
  })

  it("orders by price ascending", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({})
    expect(lastQuery?.order).toHaveBeenCalledWith("price", { ascending: true })
  })

  it("filters by status: available + active", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({})
    expect(lastQuery?.in).toHaveBeenCalledWith("status", ["available", "active"])
  })

  it("applies make filter via ilike", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ make: "Tesla" })
    expect(lastQuery?.ilike).toHaveBeenCalledWith("make", "%Tesla%")
  })

  it("applies model filter via ilike", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ model: "Model 3" })
    expect(lastQuery?.ilike).toHaveBeenCalledWith("model", "%Model 3%")
  })

  it("applies bodyStyle filter via ilike", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ bodyStyle: "SUV" })
    expect(lastQuery?.ilike).toHaveBeenCalledWith("body_style", "%SUV%")
  })

  it("applies maxPrice filter via lte", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ maxPrice: 30000 })
    expect(lastQuery?.lte).toHaveBeenCalledWith("price", 30000)
  })

  it("applies minPrice filter via gte", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ minPrice: 10000 })
    expect(lastQuery?.gte).toHaveBeenCalledWith("price", 10000)
  })

  it("applies isEv true filter", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ isEv: true })
    expect(lastQuery?.eq).toHaveBeenCalledWith("is_ev", true)
  })

  it("applies isEv false filter", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ isEv: false })
    expect(lastQuery?.eq).toHaveBeenCalledWith("is_ev", false)
  })

  it("does NOT apply isEv when undefined", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({})
    expect(lastQuery?.eq).not.toHaveBeenCalledWith("is_ev", expect.any(Boolean))
  })

  it("applies fuelType + year filters", async () => {
    const { searchInventory } = await import("@/lib/anna/inventory-search")
    await searchInventory({ fuelType: "gas", year: 2024 })
    expect(lastQuery?.ilike).toHaveBeenCalledWith("fuel_type", "%gas%")
    expect(lastQuery?.eq).toHaveBeenCalledWith("year", 2024)
  })
})

describe("getInventoryStats", () => {
  it("aggregates totals from 4 supabase calls", async () => {
    // We need 4 sequential queries — track them by call order.
    const payloads = [
      { data: [], count: 100 }, // total
      { data: [], count: 60 }, // available
      { data: [], count: 12 }, // ev count
      {
        data: [
          { make: "Toyota", price: 25000 },
          { make: "Toyota", price: 30000 },
          { make: "Honda", price: 22000 },
          { make: "Tesla", price: 50000 },
          { make: null, price: null },
        ],
        count: null,
      }, // vehicles
    ]
    let i = 0
    fromMock.mockImplementation(() => {
      const stub = makeQueryStub(payloads[i++] ?? { data: [], count: 0 })
      lastQuery = stub
      return { select: vi.fn(() => stub as QueryStub) }
    })

    const { getInventoryStats } = await import("@/lib/anna/inventory-search")
    const s = await getInventoryStats()
    expect(s.total).toBe(100)
    expect(s.available).toBe(60)
    expect(s.evCount).toBe(12)
    expect(s.priceRange.min).toBe(22000)
    expect(s.priceRange.max).toBe(50000)
    expect(s.topMakes[0]).toEqual({ make: "Toyota", count: 2 })
    expect(s.topMakes.length).toBeLessThanOrEqual(5)
  })

  it("falls back to 0 when counts are null and prices empty", async () => {
    const payloads = [
      { data: [], count: null },
      { data: [], count: null },
      { data: [], count: null },
      { data: [], count: null },
    ]
    let i = 0
    fromMock.mockImplementation(() => {
      const stub = makeQueryStub(payloads[i++] ?? { data: [], count: 0 })
      lastQuery = stub
      return { select: vi.fn(() => stub as QueryStub) }
    })

    const { getInventoryStats } = await import("@/lib/anna/inventory-search")
    const s = await getInventoryStats()
    expect(s.total).toBe(0)
    expect(s.available).toBe(0)
    expect(s.evCount).toBe(0)
    expect(s.priceRange).toEqual({ min: 0, max: 0 })
    expect(s.topMakes).toEqual([])
  })

  it("vehiclesResult.data null is coerced to []", async () => {
    const payloads = [
      { data: [], count: 5 },
      { data: [], count: 5 },
      { data: [], count: 0 },
      { data: null, count: null },
    ]
    let i = 0
    fromMock.mockImplementation(() => {
      const stub = makeQueryStub(payloads[i++] ?? { data: [], count: 0 })
      lastQuery = stub
      return { select: vi.fn(() => stub as QueryStub) }
    })
    const { getInventoryStats } = await import("@/lib/anna/inventory-search")
    const s = await getInventoryStats()
    expect(s.priceRange).toEqual({ min: 0, max: 0 })
  })
})

describe("makeAndCount", () => {
  it("formats make + count", async () => {
    const { makeAndCount } = await import("@/lib/anna/inventory-search")
    expect(makeAndCount({ make: "Toyota", count: 3 })).toBe("Toyota (3)")
  })
})

describe("buildInventoryContext", () => {
  it("returns natural language snippet on success", async () => {
    const payloads = [
      { data: [], count: 10 },
      { data: [], count: 7 },
      { data: [], count: 2 },
      {
        data: [
          { make: "Tesla", price: 50000 },
          { make: "Tesla", price: 60000 },
          { make: "Toyota", price: 30000 },
        ],
        count: null,
      },
    ]
    let i = 0
    fromMock.mockImplementation(() => {
      const stub = makeQueryStub(payloads[i++] ?? { data: [], count: 0 })
      lastQuery = stub
      return { select: vi.fn(() => stub as QueryStub) }
    })
    const { buildInventoryContext } = await import("@/lib/anna/inventory-search")
    const ctx = await buildInventoryContext()
    expect(ctx).toMatch(/LIVE INVENTORY/)
    expect(ctx).toMatch(/7 vehicles available out of 10 total/)
    expect(ctx).toMatch(/2 electric vehicles/)
    expect(ctx).toMatch(/Tesla \(2\)/)
    expect(ctx).toMatch(/planetmotors\.ca\/inventory/)
  })

  it("returns fallback message when supabase throws", async () => {
    fromMock.mockImplementation(() => {
      throw new Error("db down")
    })
    const { buildInventoryContext } = await import("@/lib/anna/inventory-search")
    const ctx = await buildInventoryContext()
    expect(ctx).toMatch(/temporarily unavailable/)
  })
})

describe("formatVehiclesForAnna", () => {
  it("returns 'no matching' when empty", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    expect(formatVehiclesForAnna([], 0)).toMatch(/No matching vehicles/)
  })

  it("formats single vehicle (singular)", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    const out = formatVehiclesForAnna(
      [
        {
          id: "1",
          stock_number: "S1",
          year: 2024,
          make: "Tesla",
          model: "Model 3",
          trim: "Long Range",
          price: 50000,
          mileage: 12000,
          exterior_color: "white",
          fuel_type: null,
          drivetrain: null,
          status: "available",
          is_ev: true,
          primary_image_url: null,
        },
      ],
      1,
    )
    expect(out).toMatch(/Found 1 matching vehicle:/)
    expect(out).toMatch(/2024 Tesla Model 3 Long Range/)
    expect(out).toMatch(/\(Electric\)/)
    expect(out).toMatch(/Stock #S1/)
    expect(out).toMatch(/— white/)
  })

  it("formats plural correctly", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    const v = {
      id: "1",
      stock_number: "S1",
      year: 2024,
      make: "Toyota",
      model: "Camry",
      trim: null,
      price: 28000,
      mileage: 12000,
      exterior_color: null,
      fuel_type: "gas",
      drivetrain: "FWD",
      status: "available",
      is_ev: false,
      primary_image_url: null,
    }
    const out = formatVehiclesForAnna([v, { ...v, id: "2", stock_number: "S2" }], 5)
    expect(out).toMatch(/Found 5 matching vehicles:/)
    expect(out).toMatch(/and 3 more/)
    // No (Electric) when is_ev=false
    expect(out).not.toMatch(/\(Electric\)/)
  })

  it("does not append 'and N more' when total <= shown", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    const v = {
      id: "1",
      stock_number: "S1",
      year: 2024,
      make: "Toyota",
      model: "Camry",
      trim: null,
      price: 28000,
      mileage: 12000,
      exterior_color: null,
      fuel_type: null,
      drivetrain: null,
      status: "available",
      is_ev: false,
      primary_image_url: null,
    }
    const out = formatVehiclesForAnna([v], 1)
    expect(out).not.toMatch(/and \d+ more/)
  })
})
