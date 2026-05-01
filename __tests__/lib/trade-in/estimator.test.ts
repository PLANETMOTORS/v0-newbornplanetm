import { describe, it, expect } from "vitest"
import {
  estimateTradeInValue,
  VEHICLE_CONDITIONS,
  type EstimatorInput,
} from "@/lib/trade-in/estimator"

const baseInput: EstimatorInput = {
  year: 2020,
  make: "Toyota",
  mileage: 40000,
  condition: "good",
  referenceYear: 2026,
}

describe("estimateTradeInValue — known anchors", () => {
  it("a 2026 Tesla in excellent shape with 0 km is the most valuable case", () => {
    const r = estimateTradeInValue({
      year: 2026,
      make: "tesla",
      mileage: 0,
      condition: "excellent",
      referenceYear: 2026,
    })
    expect(r.lowEstimate).toBeGreaterThan(40_000)
    expect(r.highEstimate).toBeGreaterThan(r.lowEstimate)
    expect(r.averageEstimate).toBeGreaterThanOrEqual(r.lowEstimate)
    expect(r.averageEstimate).toBeLessThanOrEqual(r.highEstimate)
  })

  it("an extreme depreciation case clamps to the floor values", () => {
    // age=0 keeps `expected` at 0, so the huge mileage feeds straight into
    // the deduction branch and drives the running value negative — the
    // floor clamp is what produces the 500 / 1000 / 750 envelope.
    const r = estimateTradeInValue({
      year: 2026,
      make: "unknown-make",
      mileage: 1_000_000,
      condition: "poor",
      referenceYear: 2026,
    })
    expect(r.lowEstimate).toBe(500)
    expect(r.highEstimate).toBe(1000)
    expect(r.averageEstimate).toBe(750)
  })
})

describe("estimateTradeInValue — pure-function invariants", () => {
  it("is deterministic (same input → same output)", () => {
    const a = estimateTradeInValue(baseInput)
    const b = estimateTradeInValue(baseInput)
    expect(a).toEqual(b)
  })

  it("returns integer estimates", () => {
    const r = estimateTradeInValue(baseInput)
    expect(Number.isInteger(r.lowEstimate)).toBe(true)
    expect(Number.isInteger(r.highEstimate)).toBe(true)
    expect(Number.isInteger(r.averageEstimate)).toBe(true)
  })

  it("low ≤ avg ≤ high in every condition", () => {
    for (const condition of VEHICLE_CONDITIONS) {
      const r = estimateTradeInValue({ ...baseInput, condition })
      expect(r.lowEstimate).toBeLessThanOrEqual(r.averageEstimate)
      expect(r.averageEstimate).toBeLessThanOrEqual(r.highEstimate)
    }
  })

  it("excellent ≥ good ≥ fair ≥ poor for the same vehicle", () => {
    const e = estimateTradeInValue({ ...baseInput, condition: "excellent" })
    const g = estimateTradeInValue({ ...baseInput, condition: "good" })
    const f = estimateTradeInValue({ ...baseInput, condition: "fair" })
    const p = estimateTradeInValue({ ...baseInput, condition: "poor" })
    expect(e.averageEstimate).toBeGreaterThanOrEqual(g.averageEstimate)
    expect(g.averageEstimate).toBeGreaterThanOrEqual(f.averageEstimate)
    expect(f.averageEstimate).toBeGreaterThanOrEqual(p.averageEstimate)
  })

  it("higher mileage on the same vehicle = lower estimate", () => {
    const low = estimateTradeInValue({ ...baseInput, mileage: 40_000 })
    const high = estimateTradeInValue({ ...baseInput, mileage: 200_000 })
    expect(high.averageEstimate).toBeLessThan(low.averageEstimate)
  })

  it("older year = lower estimate (vs same vehicle today)", () => {
    const newer = estimateTradeInValue({ ...baseInput, year: 2024 })
    const older = estimateTradeInValue({ ...baseInput, year: 2010 })
    expect(older.averageEstimate).toBeLessThan(newer.averageEstimate)
  })

  it("unknown make falls back to the default base value", () => {
    const r = estimateTradeInValue({ ...baseInput, make: "spaceship" })
    expect(r.averageEstimate).toBeGreaterThan(0)
  })

  it("make matching is case-insensitive", () => {
    const a = estimateTradeInValue({ ...baseInput, make: "TOYOTA" })
    const b = estimateTradeInValue({ ...baseInput, make: "toyota" })
    const c = estimateTradeInValue({ ...baseInput, make: " Toyota " })
    expect(a).toEqual(b)
    expect(a).toEqual(c)
  })

  it("future-year vehicle clamps age at 0 (no negative age)", () => {
    const r = estimateTradeInValue({ ...baseInput, year: 2030, referenceYear: 2026 })
    const sameYear = estimateTradeInValue({ ...baseInput, year: 2026, referenceYear: 2026 })
    expect(r.averageEstimate).toEqual(sameYear.averageEstimate)
  })
})

describe("VEHICLE_CONDITIONS", () => {
  it("has the canonical 4", () => {
    expect(new Set(VEHICLE_CONDITIONS)).toEqual(
      new Set(["excellent", "good", "fair", "poor"]),
    )
  })
})
