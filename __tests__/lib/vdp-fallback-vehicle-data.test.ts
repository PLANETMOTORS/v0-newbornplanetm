import { describe, expect, it } from "vitest"
import { FALLBACK_VEHICLE_DATA } from "@/lib/vdp/fallback-vehicle-data"

describe("FALLBACK_VEHICLE_DATA", () => {
  it("has the expected demo Tesla Model 3 identity", () => {
    expect(FALLBACK_VEHICLE_DATA.id).toBe("2024-tesla-model-3")
    expect(FALLBACK_VEHICLE_DATA.year).toBe(2024)
    expect(FALLBACK_VEHICLE_DATA.make).toBe("Tesla")
    expect(FALLBACK_VEHICLE_DATA.model).toBe("Model 3")
    expect(FALLBACK_VEHICLE_DATA.trim).toBe("Long Range AWD")
  })

  it("has price/mileage/VIN fields populated", () => {
    expect(FALLBACK_VEHICLE_DATA.price).toBe(52990)
    expect(FALLBACK_VEHICLE_DATA.mileage).toBe(12500)
    expect(FALLBACK_VEHICLE_DATA.vin).toMatch(/^5YJ3E1EA1PF/)
    expect(FALLBACK_VEHICLE_DATA.stockNumber).toBe("PM24-1234")
  })

  it("includes EV-specific fields", () => {
    expect(FALLBACK_VEHICLE_DATA.fuelType).toBe("Electric")
    expect(FALLBACK_VEHICLE_DATA.range).toBe("576 km")
    expect(FALLBACK_VEHICLE_DATA.batteryHealth).toBe(98)
    expect(FALLBACK_VEHICLE_DATA.batteryCapacity).toBe("82 kWh")
  })

  it("declares all 9 inspection categories summing to 210", () => {
    const total = FALLBACK_VEHICLE_DATA.inspectionCategories.reduce((sum, c) => sum + c.points, 0)
    expect(FALLBACK_VEHICLE_DATA.inspectionScore).toBe(210)
    expect(total).toBe(210)
    expect(FALLBACK_VEHICLE_DATA.inspectionCategories.length).toBe(9)
  })

  it("includes all 4 protection packages", () => {
    const names = FALLBACK_VEHICLE_DATA.protectionPackages.map(p => p.name)
    expect(names).toEqual(["Basic", "Essential Shield", "Planet Care™", "Planet Care Plus™"])
    const recommended = FALLBACK_VEHICLE_DATA.protectionPackages.find(p => p.recommended)
    expect(recommended?.name).toBe("Planet Care™")
  })

  it("has computed pricing breakdown with positive HST and total", () => {
    expect(FALLBACK_VEHICLE_DATA.pricing.vehiclePrice).toBe(52990)
    expect(FALLBACK_VEHICLE_DATA.pricing.hst).toBeGreaterThan(0)
    expect(FALLBACK_VEHICLE_DATA.pricing.totalWithHst).toBeGreaterThan(52990)
  })

  it("has clean vehicle history (no accidents)", () => {
    expect(FALLBACK_VEHICLE_DATA.history.accidents).toBe(0)
    expect(FALLBACK_VEHICLE_DATA.history.owners).toBe(1)
  })

  it("ratings sum to consistent overall picture", () => {
    expect(FALLBACK_VEHICLE_DATA.ratings.overall).toBeGreaterThan(0)
    expect(FALLBACK_VEHICLE_DATA.ratings.categories.length).toBeGreaterThan(0)
    for (const c of FALLBACK_VEHICLE_DATA.ratings.categories) {
      expect(c.score).toBeGreaterThan(0)
      expect(c.score).toBeLessThanOrEqual(5)
    }
  })

  it("has all expected feature categories", () => {
    expect(Object.keys(FALLBACK_VEHICLE_DATA.features).sort()).toEqual(
      ["brakingTraction", "comfortConvenience", "entertainmentTech", "safetySecurity"].sort(),
    )
  })

  it("declares full inspection sub-arrays for each major category", () => {
    expect(FALLBACK_VEHICLE_DATA.fullInspection.evSystems.length).toBeGreaterThan(0)
    expect(FALLBACK_VEHICLE_DATA.fullInspection.brakesSuspension.length).toBeGreaterThan(0)
    expect(FALLBACK_VEHICLE_DATA.fullInspection.detailingSafety.length).toBeGreaterThan(0)
  })
})
