import { describe, expect, it } from "vitest"
import { PRODUCTS, getProductById, getProductPrice } from "@/lib/products"

describe("PRODUCTS catalog", () => {
  it("contains the expected product IDs", () => {
    const ids = PRODUCTS.map(p => p.id).sort()
    expect(ids).toEqual([
      "delivery-express",
      "delivery-standard",
      "financing-application-fee",
      "planetcare-essential",
      "planetcare-lifeproof",
      "planetcare-smart",
      "vehicle-reservation",
    ].sort())
  })

  it("every product has name, description and priceInCents", () => {
    for (const p of PRODUCTS) {
      expect(typeof p.id).toBe("string")
      expect(p.id.length).toBeGreaterThan(0)
      expect(typeof p.name).toBe("string")
      expect(typeof p.description).toBe("string")
      expect(typeof p.priceInCents).toBe("number")
      expect(p.priceInCents).toBeGreaterThanOrEqual(0)
    }
  })

  it("standard delivery is free (0 cents)", () => {
    const product = PRODUCTS.find(p => p.id === "delivery-standard")
    expect(product?.priceInCents).toBe(0)
  })
})

describe("getProductById", () => {
  it("returns the product when ID matches", () => {
    const p = getProductById("vehicle-reservation")
    expect(p).toBeDefined()
    expect(p?.priceInCents).toBe(25000)
  })

  it("returns undefined for unknown ID", () => {
    expect(getProductById("does-not-exist")).toBeUndefined()
    expect(getProductById("")).toBeUndefined()
  })
})

describe("getProductPrice", () => {
  it("returns priceInCents for a valid product", () => {
    expect(getProductPrice("vehicle-reservation")).toBe(25000)
    expect(getProductPrice("delivery-express")).toBe(49900)
    expect(getProductPrice("delivery-standard")).toBe(0)
  })

  it("returns 0 for unknown product (nullish coalescing)", () => {
    expect(getProductPrice("nope")).toBe(0)
  })
})
