import { describe, it, expect } from "vitest"
import {
  PROTECTION_PACKAGES,
  COMPARISON_ROWS,
  CHECKOUT_PLANS,
  getPackageById,
  getCheckoutPackages,
} from "@/lib/constants/protection-packages"

describe("protection-packages", () => {
  describe("PROTECTION_PACKAGES", () => {
    it("contains 4 packages", () => {
      expect(PROTECTION_PACKAGES).toHaveLength(4)
    })

    it("has correct ids", () => {
      const ids = PROTECTION_PACKAGES.map(p => p.id)
      expect(ids).toEqual(["basic", "essential", "certified", "certified-plus"])
    })

    it("certified package is highlighted", () => {
      const certified = PROTECTION_PACKAGES.find(p => p.id === "certified")
      expect(certified?.highlighted).toBe(true)
      expect(certified?.badge).toBe("Most Popular")
    })

    it("all packages have required feature flags", () => {
      for (const pkg of PROTECTION_PACKAGES) {
        expect(typeof pkg.features.returnPolicy).toBe("boolean")
        expect(typeof pkg.features.inspection).toBe("boolean")
        expect(typeof pkg.features.safetyCertificate).toBe("boolean")
        expect(typeof pkg.features.tireRimProtection).toBe("boolean")
      }
    })
  })

  describe("COMPARISON_ROWS", () => {
    it("contains expected rows", () => {
      expect(COMPARISON_ROWS.length).toBeGreaterThan(5)
      expect(COMPARISON_ROWS.find(r => r.key === "warranty")).toBeDefined()
      expect(COMPARISON_ROWS.find(r => r.key === "freeDelivery")).toBeDefined()
    })
  })

  describe("CHECKOUT_PLANS", () => {
    it("maps packages to checkout plans", () => {
      expect(CHECKOUT_PLANS).toHaveLength(4)
      for (const plan of CHECKOUT_PLANS) {
        expect(plan.id).toBeTruthy()
        expect(plan.name).toBeTruthy()
        expect(typeof plan.price).toBe("number")
        expect(Array.isArray(plan.features)).toBe(true)
      }
    })

    it("certified plan includes warranty and delivery features", () => {
      const certified = CHECKOUT_PLANS.find(p => p.id === "certified")
      expect(certified?.features).toContain("Extended warranty")
      expect(certified?.features).toContain("FREE delivery")
    })

    it("basic plan has no warranty feature", () => {
      const basic = CHECKOUT_PLANS.find(p => p.id === "basic")
      expect(basic?.features).not.toContain("Standard warranty")
      expect(basic?.features).not.toContain("Extended warranty")
    })
  })

  describe("getPackageById", () => {
    it("returns package for known id", () => {
      expect(getPackageById("essential")?.name).toBe("PlanetCare Essential")
    })

    it("returns undefined for unknown id", () => {
      expect(getPackageById("unknown")).toBeUndefined()
    })
  })

  describe("getCheckoutPackages", () => {
    it("returns all packages", () => {
      expect(getCheckoutPackages()).toEqual(PROTECTION_PACKAGES)
    })
  })
})
