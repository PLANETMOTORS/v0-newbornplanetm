import { describe, expect, it } from "vitest"
import {
  PROTECTION_PRODUCTS,
  getProductBySlug,
  getAllProductSlugs,
  WARRANTY_COVERAGE_MATRIX,
} from "@/lib/protection-products"

describe("PROTECTION_PRODUCTS catalog", () => {
  it("exposes 9 protection products", () => {
    expect(PROTECTION_PRODUCTS).toHaveLength(9)
  })

  it("every product has the required shape", () => {
    for (const p of PROTECTION_PRODUCTS) {
      expect(p.slug).toMatch(/^[a-z][a-z-]+$/)
      expect(p.name).toBeTruthy()
      expect(p.shortName).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.heroDescription).toBeTruthy()
      expect(Array.isArray(p.howItWorks)).toBe(true)
      expect(Array.isArray(p.covered)).toBe(true)
      expect(Array.isArray(p.notCovered)).toBe(true)
      expect(Array.isArray(p.benefits)).toBe(true)
      expect(Array.isArray(p.faqs)).toBe(true)
      expect(p.ctaText).toBeTruthy()
      expect(p.seo.title).toBeTruthy()
      expect(p.seo.description).toBeTruthy()
      expect(Array.isArray(p.seo.keywords)).toBe(true)
    }
  })

  it("howItWorks steps are numbered 1-3 in order", () => {
    for (const p of PROTECTION_PRODUCTS) {
      expect(p.howItWorks.map((s) => s.step)).toEqual([1, 2, 3])
    }
  })

  it("slugs are unique", () => {
    const slugs = PROTECTION_PRODUCTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  describe("getProductBySlug", () => {
    it("returns the matching product for known slugs", () => {
      const slugs = getAllProductSlugs()
      for (const slug of slugs) {
        const r = getProductBySlug(slug)
        expect(r?.slug).toBe(slug)
      }
    })

    it("returns specific known products", () => {
      expect(getProductBySlug("gap-coverage")?.shortName).toBe("GAP Coverage")
      expect(getProductBySlug("paint-protection")?.shortName).toBe("Paint Protection")
      expect(getProductBySlug("rust-protection")?.shortName).toBe("Rust Protection")
    })

    it("returns undefined for unknown slugs", () => {
      expect(getProductBySlug("not-a-real-slug")).toBeUndefined()
      expect(getProductBySlug("")).toBeUndefined()
    })
  })

  describe("getAllProductSlugs", () => {
    it("returns all slug strings", () => {
      const slugs = getAllProductSlugs()
      expect(slugs).toHaveLength(PROTECTION_PRODUCTS.length)
      expect(slugs).toContain("gap-coverage")
      expect(slugs).toContain("extended-warranty")
      expect(slugs).toContain("incident-pro")
    })
  })
})

describe("WARRANTY_COVERAGE_MATRIX", () => {
  it("provides at least 9 coverage categories (Carvana-style component matrix)", () => {
    expect(WARRANTY_COVERAGE_MATRIX.length).toBeGreaterThanOrEqual(9)
  })

  it("every category has a name, icon, and components list", () => {
    for (const c of WARRANTY_COVERAGE_MATRIX) {
      expect(c.category).toBeTruthy()
      expect(c.icon).toBeTruthy()
      expect(c.components.length).toBeGreaterThan(0)
    }
  })

  it("includes Engine, Transmission, Electrical categories", () => {
    const names = WARRANTY_COVERAGE_MATRIX.map((c) => c.category)
    expect(names).toContain("Engine")
    expect(names).toContain("Transmission")
    expect(names).toContain("Electrical")
  })
})
