import { describe, it, expect } from "vitest"
import { randomFloat, randomInt } from "@/lib/util/random"

describe("randomFloat", () => {
  it("returns a number in [0, 1)", () => {
    for (let i = 0; i < 1000; i++) {
      const v = randomFloat()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe("randomInt", () => {
  it("returns integers in [min, max] inclusive", () => {
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(5, 10)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it("hits both endpoints when sample is large", () => {
    const seen = new Set<number>()
    for (let i = 0; i < 5000 && seen.size < 3; i++) seen.add(randomInt(0, 2))
    expect(seen.has(0)).toBe(true)
    expect(seen.has(2)).toBe(true)
  })

  it("returns min when range is invalid (max < min)", () => {
    expect(randomInt(10, 5)).toBe(10)
  })

  it("returns min when given a non-finite number", () => {
    expect(randomInt(Number.NaN, 10)).toBe(Number.NaN)
    expect(Number.isNaN(randomInt(Number.NaN, 10))).toBe(true)
    expect(randomInt(0, Number.POSITIVE_INFINITY)).toBe(0)
  })

  it("returns the singleton when min === max", () => {
    expect(randomInt(7, 7)).toBe(7)
  })
})
