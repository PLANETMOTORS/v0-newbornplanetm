import { describe, it, expect } from "vitest"
import { tradeInQuoteRequestSchema } from "@/lib/trade-in/schemas"

const validBase = {
  year: 2020,
  make: "Toyota",
  model: "Corolla",
  mileage: 40000,
  condition: "good" as const,
}

describe("tradeInQuoteRequestSchema — happy paths", () => {
  it("parses a minimal valid request", () => {
    const r = tradeInQuoteRequestSchema.safeParse(validBase)
    expect(r.success).toBe(true)
  })

  it("parses with all optional fields populated", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      vin: "1HGBH41JXMN109186",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "+1 (416) 555-0100",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.vin).toBe("1HGBH41JXMN109186")
      expect(r.data.customerEmail).toBe("jane@example.com")
    }
  })

  it("coerces a numeric string year to int", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, year: "2020" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.year).toBe(2020)
  })

  it("coerces a numeric string mileage to int", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, mileage: "40000" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.mileage).toBe(40000)
  })

  it("trims whitespace on make/model", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      make: "  Toyota  ",
      model: "  Corolla  ",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.make).toBe("Toyota")
      expect(r.data.model).toBe("Corolla")
    }
  })

  it("upper-cases and accepts lowercase VINs", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      vin: "1hgbh41jxmn109186",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.vin).toBe("1HGBH41JXMN109186")
  })

  it("lower-cases and trims emails", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      customerEmail: "  Jane@Example.COM  ",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.customerEmail).toBe("jane@example.com")
  })

  it("treats empty customerName as undefined", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      customerName: "   ",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.customerName).toBeUndefined()
  })
})

describe("tradeInQuoteRequestSchema — rejections", () => {
  it("rejects unknown keys (.strict())", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, hacked: true })
    expect(r.success).toBe(false)
  })

  it("rejects missing make", () => {
    const { make: _drop, ...rest } = validBase
    const r = tradeInQuoteRequestSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("rejects empty make after trim", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, make: "   " })
    expect(r.success).toBe(false)
  })

  it("rejects non-finite year (string 'abc')", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, year: "abc" })
    expect(r.success).toBe(false)
  })

  it("rejects year below 1900", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, year: 1899 })
    expect(r.success).toBe(false)
  })

  it("rejects year far in the future", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, year: 9999 })
    expect(r.success).toBe(false)
  })

  it("rejects negative mileage", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, mileage: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects mileage above the cap", () => {
    const r = tradeInQuoteRequestSchema.safeParse({ ...validBase, mileage: 5_000_000 })
    expect(r.success).toBe(false)
  })

  it("rejects unknown condition", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      condition: "shiny" as unknown as "good",
    })
    expect(r.success).toBe(false)
  })

  it("rejects VIN with forbidden characters (I/O/Q)", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      vin: "1IGBH41JXMN109186",
    })
    expect(r.success).toBe(false)
  })

  it("rejects VIN of wrong length", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      vin: "1HGBH41JXMN10918",
    })
    expect(r.success).toBe(false)
  })

  it("rejects malformed email", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      customerEmail: "not-an-email",
    })
    expect(r.success).toBe(false)
  })

  it("rejects emoji-only phone", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      customerPhone: "🦄🦄🦄",
    })
    expect(r.success).toBe(false)
  })

  it("rejects oversized customerName", () => {
    const r = tradeInQuoteRequestSchema.safeParse({
      ...validBase,
      customerName: "a".repeat(500),
    })
    expect(r.success).toBe(false)
  })
})
