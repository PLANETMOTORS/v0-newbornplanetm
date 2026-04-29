import { describe, it, expect } from "vitest"
import { PRODUCTS, getProductById, getProductPrice } from "@/lib/products"

describe("products", () => {
  describe("PRODUCTS", () => {
    it("contains expected product entries", () => {
      expect(PRODUCTS.length).toBeGreaterThan(0)
      expect(PRODUCTS.find(p => p.id === "vehicle-reservation")).toBeDefined()
      expect(PRODUCTS.find(p => p.id === "delivery-express")).toBeDefined()
    })

    it("all products have required fields", () => {
      for (const p of PRODUCTS) {
        expect(p.id).toBeTruthy()
        expect(p.name).toBeTruthy()
        expect(p.description).toBeTruthy()
        expect(typeof p.priceInCents).toBe("number")
      }
    })
  })

  describe("getProductById", () => {
    it("returns product for known id", () => {
      const p = getProductById("vehicle-reservation")
      expect(p).toBeDefined()
      expect(p?.priceInCents).toBe(25000)
    })

    it("returns undefined for unknown id", () => {
      expect(getProductById("nonexistent")).toBeUndefined()
    })
  })

  describe("getProductPrice", () => {
    it("returns price for known id", () => {
      expect(getProductPrice("vehicle-reservation")).toBe(25000)
    })

    it("returns 0 for unknown id", () => {
      expect(getProductPrice("unknown")).toBe(0)
    })

    it("returns 0 for free product", () => {
      expect(getProductPrice("delivery-standard")).toBe(0)
    })
  })
})
