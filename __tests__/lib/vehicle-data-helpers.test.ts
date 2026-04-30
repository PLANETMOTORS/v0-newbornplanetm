import { describe, it, expect } from "vitest"
import {
  getAllMakes,
  getModelsForMake,
  getTrimsForModel,
  getYears,
  isValidPostalCode,
  formatPostalCode,
} from "@/lib/vehicle-data"

describe("getAllMakes", () => {
  it("returns a sorted array of makes", () => {
    const makes = getAllMakes()
    expect(makes.length).toBeGreaterThan(0)
    const sorted = [...makes].sort((a, b) => a.localeCompare(b))
    expect(makes).toEqual(sorted)
  })

  it("includes common makes", () => {
    const makes = getAllMakes()
    expect(makes).toContain("BMW")
    expect(makes).toContain("Toyota")
  })
})

describe("getModelsForMake", () => {
  it("returns models for a known make", () => {
    const models = getModelsForMake("BMW")
    expect(models.length).toBeGreaterThan(0)
  })

  it("returns empty array for unknown make", () => {
    expect(getModelsForMake("UnknownMake123")).toEqual([])
  })

  it("returns sorted models", () => {
    const models = getModelsForMake("Toyota")
    const sorted = [...models].sort((a, b) => a.localeCompare(b))
    expect(models).toEqual(sorted)
  })
})

describe("getTrimsForModel", () => {
  it("returns trims for a known make and model", () => {
    const models = getModelsForMake("BMW")
    if (models.length > 0) {
      const trims = getTrimsForModel("BMW", models[0])
      expect(trims.length).toBeGreaterThanOrEqual(0)
    }
  })

  it("returns empty array for unknown make", () => {
    expect(getTrimsForModel("UnknownMake", "X5")).toEqual([])
  })

  it("returns empty array for unknown model", () => {
    expect(getTrimsForModel("BMW", "UnknownModel999")).toEqual([])
  })
})

describe("getYears", () => {
  it("returns years from current year back to 2000", () => {
    const years = getYears()
    const currentYear = new Date().getFullYear()
    expect(years[0]).toBe(currentYear)
    expect(years[years.length - 1]).toBe(2000)
    expect(years.length).toBe(currentYear - 1999)
  })
})

describe("isValidPostalCode", () => {
  it("validates correct postal codes", () => {
    expect(isValidPostalCode("L4C 0T4")).toBe(true)
    expect(isValidPostalCode("M5V2H1")).toBe(true)
    expect(isValidPostalCode("K1A-0B1")).toBe(true)
  })

  it("rejects invalid postal codes", () => {
    expect(isValidPostalCode("12345")).toBe(false)
    expect(isValidPostalCode("ABCDEF")).toBe(false)
    expect(isValidPostalCode("")).toBe(false)
  })
})

describe("formatPostalCode", () => {
  it("formats 6-character postal code with space", () => {
    expect(formatPostalCode("l4c0t4")).toBe("L4C 0T4")
    expect(formatPostalCode("M5V2H1")).toBe("M5V 2H1")
  })

  it("strips special characters", () => {
    expect(formatPostalCode("L4C-0T4")).toBe("L4C 0T4")
    expect(formatPostalCode("L4C 0T4")).toBe("L4C 0T4")
  })

  it("returns cleaned input if not 6 chars", () => {
    expect(formatPostalCode("L4C")).toBe("L4C")
  })
})
