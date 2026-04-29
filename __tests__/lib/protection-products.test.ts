import { describe, expect, it } from "vitest"
import {
  PROTECTION_PRODUCTS,
  WARRANTY_COVERAGE_MATRIX,
  getProductBySlug,
  getAllProductSlugs,
} from "@/lib/protection-products"

describe("PROTECTION_PRODUCTS", () => {
  it("exposes 9 protection products", () => {
    expect(PROTECTION_PRODUCTS.length).toBe(9)
  })

  it("all products have unique slugs", () => {
    const slugs = PROTECTION_PRODUCTS.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("every product has the expected shape", () => {
    for (const p of PROTECTION_PRODUCTS) {
      expect(typeof p.slug).toBe("string")
      expect(typeof p.name).toBe("string")
      expect(typeof p.shortName).toBe("string")
      expect(typeof p.tagline).toBe("string")
      expect(typeof p.description).toBe("string")
      expect(typeof p.heroDescription).toBe("string")
      expect(typeof p.ctaText).toBe("string")
      expect(p.howItWorks.length).toBeGreaterThanOrEqual(3)
      expect(p.covered.length).toBeGreaterThan(0)
      expect(p.notCovered.length).toBeGreaterThan(0)
      expect(p.benefits.length).toBeGreaterThan(0)
      expect(p.faqs.length).toBeGreaterThan(0)
      expect(p.seo.title.length).toBeGreaterThan(0)
      expect(p.seo.description.length).toBeGreaterThan(0)
      expect(p.seo.keywords.length).toBeGreaterThan(0)
    }
  })

  it("includes the gap-coverage and extended-warranty products", () => {
    const slugs = PROTECTION_PRODUCTS.map(p => p.slug)
    expect(slugs).toContain("gap-coverage")
    expect(slugs).toContain("extended-warranty")
    expect(slugs).toContain("incident-pro")
    expect(slugs).toContain("anti-theft")
    expect(slugs).toContain("paint-protection")
    expect(slugs).toContain("replacement-warranty")
    expect(slugs).toContain("rust-protection")
    expect(slugs).toContain("tire-rim-protection")
    expect(slugs).toContain("window-tint")
  })

  it("howItWorks steps are sequentially numbered starting at 1", () => {
    for (const p of PROTECTION_PRODUCTS) {
      const steps = p.howItWorks.map(s => s.step)
      expect(steps[0]).toBe(1)
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i]).toBe(steps[i - 1] + 1)
      }
    }
  })
})

describe("getProductBySlug", () => {
  it("returns the matching product", () => {
    const p = getProductBySlug("gap-coverage")
    expect(p?.name).toBe("Companion GAP Coverage")
  })

  it("returns undefined for unknown slug", () => {
    expect(getProductBySlug("does-not-exist")).toBeUndefined()
  })

  it("returns undefined for empty slug", () => {
    expect(getProductBySlug("")).toBeUndefined()
  })
})

describe("getAllProductSlugs", () => {
  it("returns slugs for every product", () => {
    const slugs = getAllProductSlugs()
    expect(slugs.length).toBe(PROTECTION_PRODUCTS.length)
    expect(slugs).toContain("gap-coverage")
  })
})

describe("WARRANTY_COVERAGE_MATRIX", () => {
  it("declares all major component categories", () => {
    const cats = WARRANTY_COVERAGE_MATRIX.map(c => c.category)
    expect(cats).toContain("Engine")
    expect(cats).toContain("Transmission")
    expect(cats).toContain("Electrical")
    expect(cats).toContain("Cooling System")
    expect(cats).toContain("Air Conditioning")
    expect(cats).toContain("Brakes")
    expect(cats).toContain("Fuel System")
  })

  it("each category has at least one component", () => {
    for (const c of WARRANTY_COVERAGE_MATRIX) {
      expect(c.components.length).toBeGreaterThan(0)
      expect(typeof c.icon).toBe("string")
    }
  })
})
