import { describe, it, expect } from "vitest"
import {
  RATE_FLOOR,
  DEFAULT_TERM_MONTHS,
  FINANCE_ADMIN_FEE,
  calculateBiweeklyPayment,
} from "@/lib/rates"

// ---------------------------------------------------------------------------
// Amortization CI Guard
// ---------------------------------------------------------------------------
// These tests lock the bi-weekly payment calculation so any accidental change
// to the formula, constants, or rounding immediately fails CI.
//
// Expected values were computed independently using the standard PMT formula:
//   monthly = P × [r(1+r)^n] / [(1+r)^n − 1]
//   biweekly = round(monthly × 12 / 26)
//
// where P = (price + $895 admin fee) × 1.13 (ON HST), r = APR/12, n = term.
// ---------------------------------------------------------------------------

const ON_HST = 0.13

describe("Rate constants", () => {
  it("RATE_FLOOR is 6.29", () => {
    expect(RATE_FLOOR).toBe(6.29)
  })

  it("DEFAULT_TERM_MONTHS is 72", () => {
    expect(DEFAULT_TERM_MONTHS).toBe(72)
  })

  it("FINANCE_ADMIN_FEE is 895", () => {
    expect(FINANCE_ADMIN_FEE).toBe(895)
  })
})

describe("calculateBiweeklyPayment", () => {
  it("$30,000 vehicle → $269/bi-weekly", () => {
    expect(calculateBiweeklyPayment(30_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)).toBe(269)
  })

  it("$50,000 vehicle → $444/bi-weekly", () => {
    expect(calculateBiweeklyPayment(50_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)).toBe(444)
  })

  it("$80,000 vehicle → $705/bi-weekly", () => {
    expect(calculateBiweeklyPayment(80_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)).toBe(705)
  })

  it("0% APR falls back to simple division", () => {
    const result = calculateBiweeklyPayment(30_000, 0, DEFAULT_TERM_MONTHS, ON_HST)
    // (30000 + 895) × 1.13 / 72 × 12 / 26 ≈ 224
    const subtotal = 30_000 + FINANCE_ADMIN_FEE
    const total = subtotal + subtotal * ON_HST
    const expected = Math.round((total / DEFAULT_TERM_MONTHS) * 12 / 26)
    expect(result).toBe(expected)
  })

  it("uses default parameters when called with price only", () => {
    const explicit = calculateBiweeklyPayment(50_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, 0.13)
    const defaulted = calculateBiweeklyPayment(50_000)
    expect(defaulted).toBe(explicit)
  })

  it("payment increases monotonically with vehicle price", () => {
    const p1 = calculateBiweeklyPayment(20_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)
    const p2 = calculateBiweeklyPayment(30_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)
    const p3 = calculateBiweeklyPayment(50_000, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST)
    expect(p1).toBeLessThan(p2)
    expect(p2).toBeLessThan(p3)
  })

  it("higher APR yields higher payment for the same price", () => {
    const low = calculateBiweeklyPayment(30_000, 3.99, DEFAULT_TERM_MONTHS, ON_HST)
    const high = calculateBiweeklyPayment(30_000, 12.99, DEFAULT_TERM_MONTHS, ON_HST)
    expect(low).toBeLessThan(high)
  })

  it("longer term yields lower payment for the same price and APR", () => {
    const short = calculateBiweeklyPayment(30_000, RATE_FLOOR, 48, ON_HST)
    const long = calculateBiweeklyPayment(30_000, RATE_FLOOR, 84, ON_HST)
    expect(long).toBeLessThan(short)
  })

  it("always returns a whole-dollar integer", () => {
    for (const price of [15_000, 22_500, 37_999, 55_000, 89_000]) {
      expect(Number.isInteger(calculateBiweeklyPayment(price))).toBe(true)
    }
  })

  it("never returns NaN or Infinity for boundary inputs", () => {
    const cases: [number, number, number, number][] = [
      [1, 0, 1, 0],
      [100_000, 29.99, 12, 0.15],
      [500, RATE_FLOOR, DEFAULT_TERM_MONTHS, ON_HST],
    ]
    for (const [price, apr, term, tax] of cases) {
      expect(Number.isFinite(calculateBiweeklyPayment(price, apr, term, tax))).toBe(true)
    }
  })
})
