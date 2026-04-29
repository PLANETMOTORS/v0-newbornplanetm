import { describe, it, expect } from "vitest"
import {
  PROTECTION_PRODUCTS,
  getProductBySlug,
  getAllProductSlugs,
  WARRANTY_COVERAGE_MATRIX,
} from "@/lib/protection-products"

describe("protection-products", () => {
  describe("PROTECTION_PRODUCTS", () => {
    it("contains multiple products", () => {
      expect(PROTECTION_PRODUCTS.length).toBeGreaterThan(0)
    })

    it("each product has required fields", () => {
      for (const p of PROTECTION_PRODUCTS) {
        expect(p.slug).toBeTruthy()
        expect(p.name).toBeTruthy()
        expect(p.tagline).toBeTruthy()
        expect(p.description).toBeTruthy()
        expect(p.howItWorks.length).toBeGreaterThan(0)
        expect(p.covered.length).toBeGreaterThan(0)
        expect(p.notCovered.length).toBeGreaterThan(0)
        expect(p.benefits.length).toBeGreaterThan(0)
        expect(p.faqs.length).toBeGreaterThan(0)
        expect(p.ctaText).toBeTruthy()
        expect(p.seo.title).toBeTruthy()
        expect(p.seo.description).toBeTruthy()
        expect(p.seo.keywords.length).toBeGreaterThan(0)
      }
    })

    it("includes gap-coverage product", () => {
      const gap = PROTECTION_PRODUCTS.find(p => p.slug === "gap-coverage")
      expect(gap).toBeDefined()
      expect(gap?.name).toContain("GAP")
    })
  })

  describe("getProductBySlug", () => {
    it("returns product for known slug", () => {
      const p = getProductBySlug("gap-coverage")
      expect(p).toBeDefined()
      expect(p?.slug).toBe("gap-coverage")
    })

    it("returns undefined for unknown slug", () => {
      expect(getProductBySlug("nonexistent")).toBeUndefined()
    })
  })

  describe("getAllProductSlugs", () => {
    it("returns array of slugs", () => {
      const slugs = getAllProductSlugs()
      expect(slugs.length).toBe(PROTECTION_PRODUCTS.length)
      expect(slugs).toContain("gap-coverage")
    })
  })

  describe("WARRANTY_COVERAGE_MATRIX", () => {
    it("has coverage categories", () => {
      expect(WARRANTY_COVERAGE_MATRIX.length).toBeGreaterThan(0)
    })

    it("each category has components", () => {
      for (const cat of WARRANTY_COVERAGE_MATRIX) {
        expect(cat.components.length).toBeGreaterThan(0)
      }
    })
  })
})
