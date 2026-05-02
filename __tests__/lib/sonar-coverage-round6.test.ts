/**
 * Coverage tests for new code introduced in the sonar-round-6 PR.
 * Targets the 3 files with uncovered new lines flagged by SonarCloud:
 *   - lib/imgix.ts (querySuffix extraction)
 *   - lib/anna/inventory-search.ts (makeAndCount, formatVehiclesForAnna changes)
 *   - lib/validation.ts (validateTradeInForm refactored conditional)
 */
import { describe, it, expect } from "vitest"

/* ── lib/imgix.ts ────────────────────────────────────────────────────────── */

describe("imgix", () => {
  it("builds a URL with default params", async () => {
    const { imgix } = await import("@/lib/imgix")
    const url = imgix("vehicles/photo.jpg")
    expect(url).toContain("https://")
    expect(url).toContain("vehicles/photo.jpg")
    expect(url).toContain("auto=format%2Ccompress")
    expect(url).toContain("q=85")
    expect(url).toContain("cs=srgb")
    expect(url).not.toContain("chromasub")
  })

  it("merges custom params with defaults", async () => {
    const { imgix } = await import("@/lib/imgix")
    const url = imgix("test.jpg", { w: 800, h: 600, q: 70 })
    expect(url).toContain("w=800")
    expect(url).toContain("h=600")
    expect(url).toContain("q=70") // override default 85
  })

  it("imgixWithPreset applies preset + overrides", async () => {
    const { imgixWithPreset } = await import("@/lib/imgix")
    const url = imgixWithPreset("car.jpg", "thumbnail", { q: 50 })
    expect(url).toContain("w=400")
    expect(url).toContain("h=300")
    expect(url).toContain("q=50") // override preset q=65
  })

  it("imgixMobile uses adaptive quality", async () => {
    const { imgixMobile } = await import("@/lib/imgix")
    const smallUrl = imgixMobile("car.jpg", 400)
    expect(smallUrl).toContain("w=400")
    expect(smallUrl).toContain("q=65")

    const largeUrl = imgixMobile("car.jpg", 800)
    expect(largeUrl).toContain("w=800")
    expect(largeUrl).toContain("q=72")
  })
})

/* ── lib/anna/inventory-search.ts (pure functions only) ──────────────────── */

describe("makeAndCount", () => {
  it("formats make and count", async () => {
    const { makeAndCount } = await import("@/lib/anna/inventory-search")
    expect(makeAndCount({ make: "Tesla", count: 5 })).toBe("Tesla (5)")
    expect(makeAndCount({ make: "BMW", count: 1 })).toBe("BMW (1)")
  })
})

describe("buildInventoryContext", () => {
  it("returns inventory context string with top makes using makeAndCount", async () => {
    // Mock Supabase client to avoid real DB calls
    const { vi } = await import("vitest")
    const mockData = {
      data: [
        { make: "Tesla", price: 35000 },
        { make: "Tesla", price: 42000 },
        { make: "BMW", price: 55000 },
      ],
      count: 3,
    }
    // Mock Supabase from() — each select() call returns a different shape
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn()
        .mockReturnValueOnce({ count: 3 }) // total (head: true returns directly)
        .mockReturnValueOnce({
          in: vi.fn().mockResolvedValue({ count: 3 }),
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ count: 1 }),
          }),
        })
        .mockReturnValueOnce({
          in: vi.fn().mockResolvedValue(mockData),
        }),
    })

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: () => ({ from: mockFrom }),
    }))

    // Clear module cache so the mock takes effect
    vi.resetModules()
    const { buildInventoryContext } = await import("@/lib/anna/inventory-search")
    const result = await buildInventoryContext()
    expect(result).toContain("LIVE INVENTORY")
    vi.doUnmock("@supabase/supabase-js")
    vi.resetModules()
  })

  it("returns fallback when Supabase errors", async () => {
    const { vi } = await import("vitest")
    vi.doMock("@supabase/supabase-js", () => ({
      createClient: () => ({
        from: () => ({
          select: () => { throw new Error("DB down") },
        }),
      }),
    }))
    vi.resetModules()
    const { buildInventoryContext } = await import("@/lib/anna/inventory-search")
    const result = await buildInventoryContext()
    expect(result).toContain("temporarily unavailable")
    vi.doUnmock("@supabase/supabase-js")
    vi.resetModules()
  })
})

describe("formatVehiclesForAnna", () => {
  it("returns 'no matching' for empty array", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    expect(formatVehiclesForAnna([], 0)).toBe(
      "No matching vehicles found in current inventory."
    )
  })

  it("formats a single vehicle (singular)", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    const result = formatVehiclesForAnna(
      [
        {
          id: "1",
          stock_number: "A100",
          year: 2024,
          make: "Tesla",
          model: "Model 3",
          trim: "Long Range",
          price: 45000,
          mileage: 12000,
          exterior_color: "White",
          fuel_type: "Electric",
          drivetrain: "AWD",
          status: "available",
          is_ev: true,
          primary_image_url: null,
        },
      ],
      1
    )
    expect(result).toContain("Found 1 matching vehicle:")
    expect(result).not.toContain("vehicles:")
    expect(result).toContain("Tesla Model 3 Long Range")
    expect(result).toContain("White")
    expect(result).toContain("(Electric)")
    expect(result).toContain("Stock #A100")
  })

  it("formats multiple vehicles (plural) and shows overflow", async () => {
    const { formatVehiclesForAnna } = await import("@/lib/anna/inventory-search")
    const vehicle = {
      id: "2",
      stock_number: "B200",
      year: 2023,
      make: "BMW",
      model: "X5",
      trim: null,
      price: 65000,
      mileage: 30000,
      exterior_color: null,
      fuel_type: "Gasoline",
      drivetrain: "AWD",
      status: "available",
      is_ev: false,
      primary_image_url: null,
    }
    const result = formatVehiclesForAnna([vehicle], 5)
    expect(result).toContain("Found 5 matching vehicles:")
    expect(result).toContain("BMW X5")
    expect(result).not.toContain("(Electric)")
    expect(result).toContain("...and 4 more")
  })
})

/* ── lib/homenet/parser.ts — trimSuffix, trimSlugSuffix, msrp null coerce ── */

describe("parseHomenetCSV — trim and MSRP coverage", () => {
  it("builds title/slug with trim suffix and converts MSRP", async () => {
    const { parseHomenetCSV } = await import("@/lib/homenet/parser")
    const csv = [
      "vin,stock_number,year,make,model,trim,price,msrp",
      "12345678901234567,STK001,2024,Tesla,Model 3,Long Range,45000,52000",
    ].join("\n")
    const vehicles = parseHomenetCSV(csv)
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].title).toBe("2024 Tesla Model 3 Long Range")
    expect(vehicles[0].slug).toContain("long-range")
    expect(vehicles[0].msrp).toBe(5200000) // 52000 * 100
  })

  it("builds title/slug without trim when trim is empty", async () => {
    const { parseHomenetCSV } = await import("@/lib/homenet/parser")
    const csv = [
      "vin,stock_number,year,make,model,trim,price,msrp",
      "12345678901234567,STK002,2023,BMW,X5,,65000,",
    ].join("\n")
    const vehicles = parseHomenetCSV(csv)
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].title).toBe("2023 BMW X5")
    expect(vehicles[0].slug).not.toContain("undefined")
    expect(vehicles[0].msrp).toBeUndefined() // msrpDollars == null path
  })
})

/* ── lib/validation.ts — validateTradeInForm refactored conditional ──────── */

describe("validateTradeInForm — name vs firstName/lastName branches", () => {
  it("validates with combined name field (name defined)", async () => {
    const { validateTradeInForm } = await import("@/lib/validation")
    const result = validateTradeInForm({
      name: "John Smith",
      email: "john@planetmotors.ca",
      phone: "4165551234",
      postalCode: "M5V 3A1",
    })
    expect(result.valid).toBe(true)
  })

  it("rejects invalid combined name", async () => {
    const { validateTradeInForm } = await import("@/lib/validation")
    const result = validateTradeInForm({
      name: "X",
      email: "john@planetmotors.ca",
      phone: "4165551234",
      postalCode: "M5V 3A1",
    })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it("validates with firstName/lastName when name is undefined", async () => {
    const { validateTradeInForm } = await import("@/lib/validation")
    const result = validateTradeInForm({
      firstName: "John",
      lastName: "Smith",
      email: "john@planetmotors.ca",
      phone: "4165551234",
      postalCode: "M5V 3A1",
    })
    expect(result.valid).toBe(true)
  })

  it("rejects invalid firstName when name is undefined", async () => {
    const { validateTradeInForm } = await import("@/lib/validation")
    const result = validateTradeInForm({
      firstName: "X",
      lastName: "Smith",
      email: "john@planetmotors.ca",
      phone: "4165551234",
      postalCode: "M5V 3A1",
    })
    expect(result.valid).toBe(false)
    expect(result.errors.firstName).toBeDefined()
  })
})

/* ── Branch coverage: lib/homenet/parser.ts XML trim + MSRP branches ──────── */

describe("parseHomenetXML — trim and MSRP branch coverage", () => {
  it("parses XML with trim suffix", async () => {
    const { parseHomenetXML } = await import("@/lib/homenet/parser")
    const xml = `<vehicle>
      <vin>12345678901234567</vin>
      <stocknumber>XML001</stocknumber>
      <year>2024</year>
      <make>Tesla</make>
      <model>Model Y</model>
      <trim>Performance</trim>
      <price>55000</price>
      <msrp>60000</msrp>
      <mileage>5000</mileage>
    </vehicle>`
    const vehicles = parseHomenetXML(xml)
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].title).toBe("2024 Tesla Model Y Performance")
    expect(vehicles[0].slug).toContain("performance")
    expect(vehicles[0].msrp).toBe(6000000)
  })

  it("parses XML without trim (empty branch)", async () => {
    const { parseHomenetXML } = await import("@/lib/homenet/parser")
    const xml = `<vehicle>
      <vin>12345678901234567</vin>
      <stocknumber>XML002</stocknumber>
      <year>2023</year>
      <make>BMW</make>
      <model>X5</model>
      <price>65000</price>
      <mileage>30000</mileage>
    </vehicle>`
    const vehicles = parseHomenetXML(xml)
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].title).toBe("2023 BMW X5")
    expect(vehicles[0].msrp).toBeUndefined()
  })
})

/* ── Branch coverage: lib/email.ts:321 (ico_confirmed offerAmount) ────────── */

describe("email ico_confirmed template — offerAmount branch", () => {
  it("covers the offerAmount null-coerce line", async () => {
    const { vi } = await import("vitest")
    const mockSend = vi.fn().mockResolvedValue({ data: { id: "1" }, error: null })
    vi.doMock("resend", () => ({
      Resend: class { emails = { send: mockSend } },
    }))
    process.env.RESEND_API_KEY = "re_test_fake_key"
    vi.resetModules()
    const mod = await import("@/lib/email")
    await mod.sendCustomerConfirmationEmail("buyer@test.com", "ico_confirmed", {
      customerName: "Jane",
      offerAmount: 18500,
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain("$18,500")
    expect(html).toContain("Congratulations")
    delete process.env.RESEND_API_KEY
    vi.doUnmock("resend")
    vi.resetModules()
  })
})
