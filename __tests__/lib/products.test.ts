import { describe, expect, it } from "vitest"
import { PRODUCTS, getProductById, getProductPrice, type Product } from "@/lib/products"

describe("products catalog", () => {
  it("exports a non-empty PRODUCTS array", () => {
    expect(PRODUCTS.length).toBeGreaterThan(0)
  })

  it("every product has the required shape", () => {
    for (const p of PRODUCTS) {
      const pp: Product = p
      expect(pp.id).toBeTruthy()
      expect(pp.name).toBeTruthy()
      expect(pp.description).toBeTruthy()
      expect(typeof pp.priceInCents).toBe("number")
      expect(pp.priceInCents).toBeGreaterThanOrEqual(0)
    }
  })

  it("product IDs are unique", () => {
    const ids = PRODUCTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("includes the vehicle reservation deposit at $250", () => {
    const r = getProductById("vehicle-reservation")
    expect(r).toBeDefined()
    expect(r?.priceInCents).toBe(25000)
  })

  it("includes the financing application fee", () => {
    const r = getProductById("financing-application-fee")
    expect(r).toBeDefined()
    expect(r?.priceInCents).toBe(4900)
  })

  it("includes a free standard delivery option", () => {
    const r = getProductById("delivery-standard")
    expect(r?.priceInCents).toBe(0)
  })

  it("getProductById returns undefined for unknown ids", () => {
    expect(getProductById("not-a-real-id")).toBeUndefined()
    expect(getProductById("")).toBeUndefined()
  })

  it("getProductPrice returns the cents amount", () => {
    expect(getProductPrice("vehicle-reservation")).toBe(25000)
    expect(getProductPrice("delivery-standard")).toBe(0)
  })

  it("getProductPrice returns 0 for unknown ids", () => {
    expect(getProductPrice("missing")).toBe(0)
  })
})
