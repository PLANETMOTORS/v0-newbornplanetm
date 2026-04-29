import { describe, it, expect } from "vitest"
import { mapDrivetrain, mapFuelType, mapTransmission } from "@/lib/vin/mappers"

describe("vin/mappers", () => {
  describe("mapDrivetrain", () => {
    it("maps AWD variants", () => {
      expect(mapDrivetrain("All Wheel Drive")).toBe("AWD")
      expect(mapDrivetrain("AWD")).toBe("AWD")
      expect(mapDrivetrain("4WD")).toBe("AWD")
    })

    it("maps FWD variants", () => {
      expect(mapDrivetrain("Front Wheel Drive")).toBe("FWD")
      expect(mapDrivetrain("FWD")).toBe("FWD")
    })

    it("maps RWD variants", () => {
      expect(mapDrivetrain("Rear Wheel Drive")).toBe("RWD")
      expect(mapDrivetrain("RWD")).toBe("RWD")
    })

    it("maps 4WD variants", () => {
      expect(mapDrivetrain("4x4")).toBe("4WD")
      expect(mapDrivetrain("Four Wheel Drive")).toBe("4WD")
    })

    it("returns raw for unknown", () => {
      expect(mapDrivetrain("Unknown Type")).toBe("Unknown Type")
    })
  })

  describe("mapFuelType", () => {
    it("maps gasoline", () => {
      expect(mapFuelType("Gasoline")).toBe("Gasoline")
    })

    it("maps diesel", () => {
      expect(mapFuelType("Diesel")).toBe("Diesel")
    })

    it("maps electric", () => {
      expect(mapFuelType("Electric")).toBe("Electric")
    })

    it("maps plug-in hybrid", () => {
      expect(mapFuelType("Plug-in Hybrid")).toBe("Plug-in Hybrid")
    })

    it("maps regular hybrid", () => {
      expect(mapFuelType("Hybrid")).toBe("Hybrid")
    })

    it("maps flex fuel", () => {
      expect(mapFuelType("Flex Fuel")).toBe("Flex Fuel")
    })

    it("returns raw for unknown", () => {
      expect(mapFuelType("Hydrogen")).toBe("Hydrogen")
    })
  })

  describe("mapTransmission", () => {
    it("maps automatic", () => {
      expect(mapTransmission("Automatic")).toBe("Automatic")
    })

    it("maps manual", () => {
      expect(mapTransmission("Manual")).toBe("Manual")
    })

    it("maps CVT", () => {
      expect(mapTransmission("CVT")).toBe("CVT")
    })

    it("maps DCT variants", () => {
      expect(mapTransmission("Dual Clutch")).toBe("DCT")
      expect(mapTransmission("DCT")).toBe("DCT")
    })

    it("returns raw for unknown", () => {
      expect(mapTransmission("Other")).toBe("Other")
    })
  })
})
