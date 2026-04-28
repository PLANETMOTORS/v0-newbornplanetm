import { describe, expect, it } from "vitest"
import {
  CERTIFICATION_FEE,
  FINANCE_ESTIMATE_DISCLAIMER,
  HST_RATE,
  LICENSING_FEE,
  OMVIC_DISCLAIMER,
  OMVIC_FEE,
  calculateAllInPrice,
  formatPriceForDisplay,
  safeNum,
} from "@/lib/pricing/format"

describe("lib/pricing/format constants", () => {
  it("locks the OMVIC fee at $22", () => {
    expect(OMVIC_FEE).toBe(22)
  })

  it("locks the certification fee at $595", () => {
    expect(CERTIFICATION_FEE).toBe(595)
  })

  it("locks the licensing fee at $59", () => {
    expect(LICENSING_FEE).toBe(59)
  })

  it("locks Ontario HST at 13%", () => {
    expect(HST_RATE).toBe(0.13)
  })

  it("exposes the OMVIC all-in disclaimer text", () => {
    expect(OMVIC_DISCLAIMER).toContain("OMVIC")
    expect(OMVIC_DISCLAIMER).toContain("HST is additional")
  })

  it("exposes the finance-estimate disclaimer text", () => {
    expect(FINANCE_ESTIMATE_DISCLAIMER).toContain("illustration purposes only")
  })
})

describe("lib/pricing/format safeNum", () => {
  it("returns finite numbers unchanged", () => {
    expect(safeNum(42)).toBe(42)
    expect(safeNum(0)).toBe(0)
    expect(safeNum(-1.5)).toBe(-1.5)
  })

  it("returns the fallback for NaN", () => {
    expect(safeNum(Number.NaN)).toBe(0)
    expect(safeNum(Number.NaN, 99)).toBe(99)
  })

  it("returns the fallback for Infinity", () => {
    expect(safeNum(Number.POSITIVE_INFINITY)).toBe(0)
    expect(safeNum(Number.NEGATIVE_INFINITY, 5)).toBe(5)
  })

  it("parses numeric strings", () => {
    expect(safeNum("3.14")).toBe(3.14)
    expect(safeNum("0")).toBe(0)
  })

  it("returns the fallback for non-numeric strings", () => {
    expect(safeNum("hello", 7)).toBe(7)
  })

  it("returns the fallback for null / undefined", () => {
    expect(safeNum(null)).toBe(0)
    expect(safeNum(undefined, 11)).toBe(11)
  })

  it("returns the fallback for objects, arrays, booleans, bigints", () => {
    expect(safeNum({})).toBe(0)
    expect(safeNum([])).toBe(0)
    expect(safeNum(true)).toBe(0)
    expect(safeNum(10n)).toBe(0)
  })
})

describe("lib/pricing/format formatPriceForDisplay", () => {
  it("formats whole-dollar amounts with the CAD symbol", () => {
    const out = formatPriceForDisplay(5_299_000) // 52,990 dollars
    expect(out).toMatch(/52,990/)
    expect(out).toContain("$")
  })

  it("rounds sub-dollar values to the nearest dollar", () => {
    const out = formatPriceForDisplay(149) // 1.49
    expect(out).toMatch(/^\$1$/)
  })

  it("handles zero", () => {
    expect(formatPriceForDisplay(0)).toMatch(/^\$0$/)
  })

  it("handles negative values without throwing", () => {
    const out = formatPriceForDisplay(-12_345)
    expect(typeof out).toBe("string")
    expect(out).toContain("123")
  })
})

describe("lib/pricing/format calculateAllInPrice", () => {
  it("computes the full breakdown for a $30,000 vehicle", () => {
    const b = calculateAllInPrice(30_000)
    expect(b.vehiclePrice).toBe(30_000)
    expect(b.omvicFee).toBe(OMVIC_FEE)
    expect(b.certificationFee).toBe(CERTIFICATION_FEE)
    expect(b.licensingFee).toBe(LICENSING_FEE)
    expect(b.subtotal).toBe(30_000 + OMVIC_FEE + CERTIFICATION_FEE + LICENSING_FEE)
    expect(b.hst).toBe(Math.round(b.subtotal * HST_RATE))
    expect(b.total).toBe(b.subtotal + b.hst)
  })

  it("rounds HST to the nearest dollar", () => {
    const b = calculateAllInPrice(12_345)
    expect(b.hst).toBe(Math.round((12_345 + OMVIC_FEE + CERTIFICATION_FEE + LICENSING_FEE) * HST_RATE))
    expect(Number.isInteger(b.hst)).toBe(true)
  })

  it("handles a $0 vehicle (only fees + HST applied)", () => {
    const b = calculateAllInPrice(0)
    expect(b.subtotal).toBe(OMVIC_FEE + CERTIFICATION_FEE + LICENSING_FEE)
    expect(b.total).toBe(b.subtotal + b.hst)
  })
})
