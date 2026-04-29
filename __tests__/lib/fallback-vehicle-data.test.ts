import { describe, expect, it } from "vitest"
import { FALLBACK_VEHICLE_DATA } from "@/lib/vdp/fallback-vehicle-data"

describe("FALLBACK_VEHICLE_DATA", () => {
  it("represents a 2024 Tesla Model 3 demo record", () => {
    expect(FALLBACK_VEHICLE_DATA.year).toBe(2024)
    expect(FALLBACK_VEHICLE_DATA.make).toBe("Tesla")
    expect(FALLBACK_VEHICLE_DATA.model).toBe("Model 3")
    expect(FALLBACK_VEHICLE_DATA.vin).toMatch(/^[A-Z0-9]{17}$/)
    expect(FALLBACK_VEHICLE_DATA.stockNumber).toMatch(/^PM/)
  })

  it("has empty image arrays so VDP fallback shows placeholders", () => {
    expect(FALLBACK_VEHICLE_DATA.images).toEqual([])
    expect(FALLBACK_VEHICLE_DATA.interiorImages).toEqual([])
    expect(FALLBACK_VEHICLE_DATA.driveeMid).toBeNull()
  })

  it("inspection categories sum to inspectionScore", () => {
    const total = FALLBACK_VEHICLE_DATA.inspectionCategories.reduce((acc, c) => acc + c.points, 0)
    expect(total).toBe(FALLBACK_VEHICLE_DATA.inspectionScore)
  })

  it("provides a complete fullInspection checklist", () => {
    const f = FALLBACK_VEHICLE_DATA.fullInspection
    expect(f.vinHistory.length).toBeGreaterThan(0)
    expect(f.powertrainEngine.length).toBeGreaterThan(0)
    expect(f.brakesSuspension.length).toBeGreaterThan(0)
    expect(f.tyresWheels.length).toBeGreaterThan(0)
    expect(f.exterior.length).toBeGreaterThan(0)
    expect(f.interior.length).toBeGreaterThan(0)
    expect(f.driveTest.length).toBeGreaterThan(0)
    expect(f.evSystems.length).toBeGreaterThan(0)
    expect(f.detailingSafety.length).toBeGreaterThan(0)
  })

  it("vinHistoryItems all have Pass status", () => {
    for (const item of FALLBACK_VEHICLE_DATA.vinHistoryItems) {
      expect(item.status).toBe("Pass")
      expect(item.item).toBeTruthy()
    }
  })

  it("ratings include all category scores between 0 and 5", () => {
    expect(FALLBACK_VEHICLE_DATA.ratings.overall).toBeGreaterThan(0)
    for (const c of FALLBACK_VEHICLE_DATA.ratings.categories) {
      expect(c.score).toBeGreaterThan(0)
      expect(c.score).toBeLessThanOrEqual(5)
    }
  })

  it("includes 4 protection packages with one recommended tier", () => {
    expect(FALLBACK_VEHICLE_DATA.protectionPackages).toHaveLength(4)
    const recommended = FALLBACK_VEHICLE_DATA.protectionPackages.filter((p) => p.recommended)
    expect(recommended).toHaveLength(1)
    expect(recommended[0].name).toBe("Planet Care™")
  })

  it("pricing.totalWithHst >= vehiclePrice", () => {
    const p = FALLBACK_VEHICLE_DATA.pricing
    expect(p.vehiclePrice).toBeGreaterThan(0)
    expect(p.totalWithHst).toBeGreaterThanOrEqual(p.vehiclePrice)
    expect(p.hst).toBeGreaterThan(0)
  })

  it("history is consistent for a 1-owner accident-free vehicle", () => {
    const h = FALLBACK_VEHICLE_DATA.history
    expect(h.owners).toBe(1)
    expect(h.accidents).toBe(0)
    expect(h.serviceRecords).toBeGreaterThan(0)
  })

  it("features include all four buckets", () => {
    const f = FALLBACK_VEHICLE_DATA.features
    expect(f.comfortConvenience.length).toBeGreaterThan(0)
    expect(f.safetySecurity.length).toBeGreaterThan(0)
    expect(f.entertainmentTech.length).toBeGreaterThan(0)
    expect(f.brakingTraction.length).toBeGreaterThan(0)
  })
})
