import { describe, it, expect } from "vitest"
import { normalizeBodyStyle } from "@/lib/typesense/indexer"

describe("normalizeBodyStyle", () => {
  it.each([
    ["4dr Sport Utility Vehicle", "Sport Utility"],
    ["SUV", "Sport Utility"],
    ["sport utility", "Sport Utility"],
    ["4dr Sedan", "4dr Car"],
    ["4dr Car", "4dr Car"],
    ["Pickup Truck", "Pickup"],
    ["truck", "Pickup"],
    ["Convertible", "Convertible"],
    ["Hatchback", "Hatchback"],
    ["Minivan", "Van"],
    ["Wagon", "Wagon"],
    ["Coupé", "Coupe"],
    ["coupe", "Coupe"],
  ])("normalises %s -> %s", (raw, expected) => {
    expect(normalizeBodyStyle(raw)).toBe(expected)
  })

  it("returns the original raw string for unknown body styles", () => {
    expect(normalizeBodyStyle("Spaceship")).toBe("Spaceship")
  })
})
