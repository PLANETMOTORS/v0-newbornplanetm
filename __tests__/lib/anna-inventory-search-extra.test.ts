import { describe, it, expect } from "vitest"
import { makeAndCount, formatVehiclesForAnna, type VehicleSummary } from "@/lib/anna/inventory-search"

const mockVehicle: VehicleSummary = {
  id: "v1",
  stock_number: "PM-001",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range",
  price: 45000,
  mileage: 15000,
  exterior_color: "White",
  fuel_type: "Electric",
  drivetrain: "AWD",
  status: "available",
  is_ev: true,
  primary_image_url: null,
}

describe("anna/inventory-search formatters", () => {
  describe("makeAndCount", () => {
    it("formats make and count", () => {
      expect(makeAndCount({ make: "Tesla", count: 5 })).toBe("Tesla (5)")
    })
  })

  describe("formatVehiclesForAnna", () => {
    it("returns no match message for empty array", () => {
      expect(formatVehiclesForAnna([], 0)).toBe("No matching vehicles found in current inventory.")
    })

    it("formats single vehicle correctly", () => {
      const result = formatVehiclesForAnna([mockVehicle], 1)
      expect(result).toContain("Found 1 matching vehicle:")
      expect(result).toContain("2023 Tesla Model 3 Long Range")
      expect(result).toContain("White")
      expect(result).toContain("(Electric)")
      expect(result).toContain("$45,000")
      expect(result).toContain("15,000 km")
      expect(result).toContain("Stock #PM-001")
    })

    it("shows 'and more' when total exceeds shown", () => {
      const result = formatVehiclesForAnna([mockVehicle], 10)
      expect(result).toContain("...and 9 more")
      expect(result).toContain("planetmotors.ca/inventory")
    })

    it("handles vehicle without trim or color", () => {
      const v: VehicleSummary = { ...mockVehicle, trim: null, exterior_color: null, is_ev: false }
      const result = formatVehiclesForAnna([v], 1)
      expect(result).toContain("2023 Tesla Model 3")
      expect(result).not.toContain("(Electric)")
    })

    it("uses plural for multiple vehicles", () => {
      const result = formatVehiclesForAnna([mockVehicle, { ...mockVehicle, id: "v2" }], 2)
      expect(result).toContain("Found 2 matching vehicles:")
    })
  })
})
