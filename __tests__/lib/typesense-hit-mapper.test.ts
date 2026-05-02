/**
 * Coverage test for the Typesense hit mapper inside `lib/typesense.ts`
 * `searchTypesense()`.
 *
 * The existing typesense.test.ts only exercises the Supabase fallback path;
 * this file mocks `getSearchClient` so we hit every branch in the
 * `(result.hits || []).map(...)` block — including:
 *   - happy path (string + number primitives)
 *   - missing optional fields (asOptStr -> undefined)
 *   - non-string status (default to "available")
 *   - non-numeric price/year/mileage (asNum -> 0)
 *   - object-shaped value never rendering as "[object Object]"
 *   - facet_counts mapper
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

const search = vi.hoisted(() => vi.fn())

vi.mock("@/lib/typesense/client", () => ({
  getSearchClient: vi.fn(() => ({
    collections: () => ({
      documents: () => ({
        search,
      }),
    }),
  })),
  isTypesenseConfigured: vi.fn(() => true),
  VEHICLES_COLLECTION: "vehicles",
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({ data: [], count: 0, error: null }),
      }),
    }),
  })),
}))

describe("lib/typesense → searchVehicles (Typesense path)", () => {
  beforeEach(() => {
    search.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test"
    process.env.TYPESENSE_HOST = "test.typesense.net"
    process.env.TYPESENSE_API_KEY = "test"
  })

  it("maps well-formed primitive hits with cents → dollars conversion", async () => {
    search.mockResolvedValueOnce({
      hits: [
        {
          document: {
            id: "v-1",
            stock_number: "PM-001",
            year: 2023,
            make: "Tesla",
            model: "Model 3",
            trim: "Long Range",
            body_style: "Sedan",
            exterior_color: "White",
            price: 4500000, // cents
            mileage: 12345,
            drivetrain: "AWD",
            fuel_type: "Electric",
            is_ev: true,
            is_certified: true,
            status: "available",
            primary_image_url: "https://example.com/x.jpg",
          },
        },
      ],
      facet_counts: [
        { field_name: "make", counts: [{ value: "Tesla", count: 1 }] },
      ],
      found: 1,
    })

    const { searchVehicles } = await import("@/lib/typesense")
    const result = await searchVehicles({})

    expect(result.hits).toHaveLength(1)
    const doc = result.hits[0].document
    expect(doc.id).toBe("v-1")
    expect(doc.stock_number).toBe("PM-001")
    expect(doc.year).toBe(2023)
    expect(doc.make).toBe("Tesla")
    expect(doc.model).toBe("Model 3")
    expect(doc.trim).toBe("Long Range")
    expect(doc.body_style).toBe("Sedan")
    expect(doc.exterior_color).toBe("White")
    expect(doc.price).toBe(45000) // cents → dollars
    expect(doc.mileage).toBe(12345)
    expect(doc.drivetrain).toBe("AWD")
    expect(doc.fuel_type).toBe("Electric")
    expect(doc.is_ev).toBe(true)
    expect(doc.is_certified).toBe(true)
    expect(doc.status).toBe("available")
    expect(doc.primary_image_url).toBe("https://example.com/x.jpg")
    expect(result.facet_counts[0].field_name).toBe("make")
    expect(result.facet_counts[0].counts[0]).toEqual({ value: "Tesla", count: 1 })
  })

  it("handles missing optional string fields by returning undefined", async () => {
    search.mockResolvedValueOnce({
      hits: [
        {
          document: {
            id: "v-2",
            stock_number: "PM-002",
            year: 2022,
            make: "Honda",
            model: "Civic",
            // trim / body_style / exterior_color / drivetrain / fuel_type / primary_image_url all omitted
            price: 2500000,
            mileage: 50000,
            is_ev: false,
            is_certified: false,
            status: "reserved",
          },
        },
      ],
      facet_counts: [],
      found: 1,
    })

    const { searchVehicles } = await import("@/lib/typesense")
    const result = await searchVehicles({})

    const doc = result.hits[0].document
    expect(doc.trim).toBeUndefined()
    expect(doc.body_style).toBeUndefined()
    expect(doc.exterior_color).toBeUndefined()
    expect(doc.drivetrain).toBeUndefined()
    expect(doc.fuel_type).toBeUndefined()
    expect(doc.primary_image_url).toBeUndefined()
    expect(doc.status).toBe("reserved")
  })

  it("rejects object-shaped fields (never renders [object Object])", async () => {
    // Simulate a malformed Typesense doc where an indexer accidentally
    // wrote a nested object into a primitive field. asStr / asOptStr / asNum
    // must reject and fall back to safe defaults.
    search.mockResolvedValueOnce({
      hits: [
        {
          document: {
            id: { malformed: true },
            stock_number: ["bad"],
            year: "not-a-number",
            make: { brand: "Tesla" },
            model: null,
            trim: { code: "x" },
            body_style: 42,
            exterior_color: undefined,
            price: "not-a-number",
            mileage: { km: 12000 },
            drivetrain: 7,
            fuel_type: { type: "Electric" },
            is_ev: 1,
            is_certified: 0,
            status: { tier: "available" },
            primary_image_url: { src: "x.jpg" },
          },
        },
      ],
      facet_counts: [],
      found: 1,
    })

    const { searchVehicles } = await import("@/lib/typesense")
    const result = await searchVehicles({})

    const doc = result.hits[0].document
    // Strings forced to "" (or default for status)
    expect(doc.id).toBe("")
    expect(doc.stock_number).toBe("")
    expect(doc.make).toBe("")
    expect(doc.model).toBe("")
    expect(doc.status).toBe("available") // explicit default
    // Optionals forced to undefined
    expect(doc.trim).toBeUndefined()
    expect(doc.body_style).toBeUndefined()
    expect(doc.exterior_color).toBeUndefined()
    expect(doc.drivetrain).toBeUndefined()
    expect(doc.fuel_type).toBeUndefined()
    expect(doc.primary_image_url).toBeUndefined()
    // Numbers forced to 0
    expect(doc.year).toBe(0)
    expect(doc.price).toBe(0)
    expect(doc.mileage).toBe(0)
    // Booleans coerced normally (Boolean(1) / Boolean(0))
    expect(doc.is_ev).toBe(true)
    expect(doc.is_certified).toBe(false)
  })

  it("handles an empty result set", async () => {
    search.mockResolvedValueOnce({ hits: [], facet_counts: [], found: 0 })
    const { searchVehicles } = await import("@/lib/typesense")
    const result = await searchVehicles({})
    expect(result.hits).toEqual([])
    expect(result.facet_counts).toEqual([])
  })
})
