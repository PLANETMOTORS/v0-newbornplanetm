import { describe, it, expect } from "vitest"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"

describe("PROVINCE_TAX_RATES", () => {
  it("includes all 13 Canadian provinces and territories", () => {
    expect(Object.keys(PROVINCE_TAX_RATES).sort()).toEqual([
      "AB", "BC", "MB", "NB", "NL", "NS", "NT",
      "NU", "ON", "PE", "QC", "SK", "YT",
    ])
  })

  it("total field always equals gst + pst + hst (within float epsilon)", () => {
    for (const [code, rate] of Object.entries(PROVINCE_TAX_RATES)) {
      const sum = rate.gst + rate.pst + rate.hst
      expect(
        Math.abs(sum - rate.total),
        `mismatch for ${code}`
      ).toBeLessThan(1e-9)
    }
  })

  it("HST provinces have 0% GST/PST and a single 13–15% HST", () => {
    for (const code of ["ON", "NS", "NB", "PE", "NL"]) {
      const r = PROVINCE_TAX_RATES[code]
      expect(r.gst).toBe(0)
      expect(r.pst).toBe(0)
      expect(r.hst).toBeGreaterThanOrEqual(0.13)
      expect(r.hst).toBeLessThanOrEqual(0.15)
    }
  })

  it("Alberta and the territories use only 5% GST", () => {
    for (const code of ["AB", "NT", "YT", "NU"]) {
      expect(PROVINCE_TAX_RATES[code].gst).toBe(0.05)
      expect(PROVINCE_TAX_RATES[code].pst).toBe(0)
      expect(PROVINCE_TAX_RATES[code].hst).toBe(0)
    }
  })

  it("Quebec uses GST + QST", () => {
    const qc = PROVINCE_TAX_RATES.QC
    expect(qc.gst).toBe(0.05)
    expect(qc.pst).toBeGreaterThan(0.09)
    expect(qc.hst).toBe(0)
  })
})
