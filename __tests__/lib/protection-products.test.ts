/**
 * Tests for lib/protection-products.ts
 *
 * Covers:
 *  1. PROTECTION_PRODUCTS — array structure, product count, per-product shape
 *  2. getProductBySlug() — happy path, unknown slug, case-sensitivity
 *  3. getAllProductSlugs() — returns all slugs in correct count/order
 *  4. WARRANTY_COVERAGE_MATRIX — category count, required shape per category
 */

import { describe, it, expect } from 'vitest'
import {
  PROTECTION_PRODUCTS,
  WARRANTY_COVERAGE_MATRIX,
  getProductBySlug,
  getAllProductSlugs,
  type ProtectionProduct,
  type CoverageCategory,
} from '@/lib/protection-products'

// ─── PROTECTION_PRODUCTS ─────────────────────────────────────────────────────

describe('PROTECTION_PRODUCTS', () => {
  it('contains exactly 9 products', () => {
    expect(PROTECTION_PRODUCTS).toHaveLength(9)
  })

  it('every product has the required shape', () => {
    for (const product of PROTECTION_PRODUCTS) {
      expect(typeof product.slug).toBe('string')
      expect(product.slug.length).toBeGreaterThan(0)

      expect(typeof product.name).toBe('string')
      expect(product.name.length).toBeGreaterThan(0)

      expect(typeof product.shortName).toBe('string')
      expect(typeof product.tagline).toBe('string')
      expect(typeof product.description).toBe('string')
      expect(typeof product.heroDescription).toBe('string')

      // Lucide icon components may be functions or forwardRef objects — just check it's defined and truthy
      expect(product.icon).toBeTruthy()

      expect(Array.isArray(product.howItWorks)).toBe(true)
      expect(product.howItWorks.length).toBeGreaterThanOrEqual(1)

      expect(Array.isArray(product.covered)).toBe(true)
      expect(product.covered.length).toBeGreaterThan(0)

      expect(Array.isArray(product.notCovered)).toBe(true)
      expect(product.notCovered.length).toBeGreaterThan(0)

      expect(Array.isArray(product.benefits)).toBe(true)
      expect(product.benefits.length).toBeGreaterThan(0)

      expect(Array.isArray(product.faqs)).toBe(true)
      expect(product.faqs.length).toBeGreaterThan(0)

      expect(typeof product.ctaText).toBe('string')

      // SEO object
      expect(typeof product.seo).toBe('object')
      expect(typeof product.seo.title).toBe('string')
      expect(typeof product.seo.description).toBe('string')
      expect(Array.isArray(product.seo.keywords)).toBe(true)
    }
  })

  it('every howItWorks step has step number, title, and description', () => {
    for (const product of PROTECTION_PRODUCTS) {
      for (const step of product.howItWorks) {
        expect(typeof step.step).toBe('number')
        expect(step.step).toBeGreaterThan(0)
        expect(typeof step.title).toBe('string')
        expect(typeof step.description).toBe('string')
      }
    }
  })

  it('every howItWorks step number is sequential starting from 1', () => {
    for (const product of PROTECTION_PRODUCTS) {
      const stepNumbers = product.howItWorks.map((s) => s.step)
      stepNumbers.forEach((num, idx) => {
        expect(num).toBe(idx + 1)
      })
    }
  })

  it('every benefit has title and description', () => {
    for (const product of PROTECTION_PRODUCTS) {
      for (const benefit of product.benefits) {
        expect(typeof benefit.title).toBe('string')
        expect(benefit.title.length).toBeGreaterThan(0)
        expect(typeof benefit.description).toBe('string')
        expect(benefit.description.length).toBeGreaterThan(0)
      }
    }
  })

  it('every FAQ has question and answer', () => {
    for (const product of PROTECTION_PRODUCTS) {
      for (const faq of product.faqs) {
        expect(typeof faq.question).toBe('string')
        expect(faq.question.length).toBeGreaterThan(0)
        expect(typeof faq.answer).toBe('string')
        expect(faq.answer.length).toBeGreaterThan(0)
      }
    }
  })

  it('all product slugs are unique', () => {
    const slugs = PROTECTION_PRODUCTS.map((p) => p.slug)
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(slugs.length)
  })

  it('contains the gap-coverage product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'gap-coverage')
    expect(product).toBeDefined()
    expect(product!.name).toBe('Companion GAP Coverage')
  })

  it('contains the extended-warranty product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'extended-warranty')
    expect(product).toBeDefined()
    expect(product!.name).toBe('Extended Vehicle Warranty')
  })

  it('contains the anti-theft product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'anti-theft')
    expect(product).toBeDefined()
    expect(product!.name).toBe('InvisiTrak Anti-Theft System')
  })

  it('contains the tire-rim-protection product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'tire-rim-protection')
    expect(product).toBeDefined()
    expect(product!.name).toBe('Tire and Rim Protection')
  })

  it('contains the rust-protection product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'rust-protection')
    expect(product).toBeDefined()
  })

  it('contains the paint-protection product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'paint-protection')
    expect(product).toBeDefined()
  })

  it('contains the window-tint product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'window-tint')
    expect(product).toBeDefined()
  })

  it('contains the incident-pro product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'incident-pro')
    expect(product).toBeDefined()
  })

  it('contains the replacement-warranty product', () => {
    const product = PROTECTION_PRODUCTS.find((p) => p.slug === 'replacement-warranty')
    expect(product).toBeDefined()
  })

  it('all slugs use kebab-case (lowercase with hyphens only)', () => {
    for (const product of PROTECTION_PRODUCTS) {
      expect(product.slug).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('SEO keywords arrays are non-empty for every product', () => {
    for (const product of PROTECTION_PRODUCTS) {
      expect(product.seo.keywords.length).toBeGreaterThan(0)
    }
  })
})

// ─── getProductBySlug ────────────────────────────────────────────────────────

describe('getProductBySlug', () => {
  it('returns the correct product for a valid slug', () => {
    const product = getProductBySlug('gap-coverage')
    expect(product).toBeDefined()
    expect(product!.slug).toBe('gap-coverage')
    expect(product!.name).toBe('Companion GAP Coverage')
  })

  it('returns the extended-warranty product', () => {
    const product = getProductBySlug('extended-warranty')
    expect(product).toBeDefined()
    expect(product!.shortName).toBe('Extended Warranty')
  })

  it('returns the tire-rim-protection product', () => {
    const product = getProductBySlug('tire-rim-protection')
    expect(product).toBeDefined()
    expect(product!.ctaText).toBe('Get Tire & Rim Quote')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('not-a-real-product')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getProductBySlug('')).toBeUndefined()
  })

  it('is case-sensitive (uppercase slug does not match)', () => {
    expect(getProductBySlug('GAP-COVERAGE')).toBeUndefined()
    expect(getProductBySlug('Extended-Warranty')).toBeUndefined()
  })

  it('returns undefined for "smart" (not a protection product slug)', () => {
    expect(getProductBySlug('smart')).toBeUndefined()
  })

  it('returns undefined for "certified" (this is a package, not a product)', () => {
    expect(getProductBySlug('certified')).toBeUndefined()
  })

  it('each product can be retrieved by its slug', () => {
    for (const product of PROTECTION_PRODUCTS) {
      const found = getProductBySlug(product.slug)
      expect(found).toBeDefined()
      expect(found!.slug).toBe(product.slug)
    }
  })
})

// ─── getAllProductSlugs ──────────────────────────────────────────────────────

describe('getAllProductSlugs', () => {
  it('returns an array of strings', () => {
    const slugs = getAllProductSlugs()
    expect(Array.isArray(slugs)).toBe(true)
    expect(slugs.every((s) => typeof s === 'string')).toBe(true)
  })

  it('returns the same count as PROTECTION_PRODUCTS', () => {
    expect(getAllProductSlugs()).toHaveLength(PROTECTION_PRODUCTS.length)
  })

  it('contains exactly 9 slugs', () => {
    expect(getAllProductSlugs()).toHaveLength(9)
  })

  it('contains the gap-coverage slug', () => {
    expect(getAllProductSlugs()).toContain('gap-coverage')
  })

  it('contains the extended-warranty slug', () => {
    expect(getAllProductSlugs()).toContain('extended-warranty')
  })

  it('all slugs are unique', () => {
    const slugs = getAllProductSlugs()
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('matches the slugs from PROTECTION_PRODUCTS in the same order', () => {
    const expectedSlugs = PROTECTION_PRODUCTS.map((p) => p.slug)
    expect(getAllProductSlugs()).toEqual(expectedSlugs)
  })

  it('does not include protection package IDs like "certified"', () => {
    expect(getAllProductSlugs()).not.toContain('certified')
    expect(getAllProductSlugs()).not.toContain('certified-plus')
    expect(getAllProductSlugs()).not.toContain('essential')
  })
})

// ─── WARRANTY_COVERAGE_MATRIX ────────────────────────────────────────────────

describe('WARRANTY_COVERAGE_MATRIX', () => {
  it('contains exactly 9 categories', () => {
    expect(WARRANTY_COVERAGE_MATRIX).toHaveLength(9)
  })

  it('every category has the required shape', () => {
    for (const cat of WARRANTY_COVERAGE_MATRIX) {
      expect(typeof cat.category).toBe('string')
      expect(cat.category.length).toBeGreaterThan(0)
      expect(typeof cat.icon).toBe('string')
      expect(cat.icon.length).toBeGreaterThan(0)
      expect(Array.isArray(cat.components)).toBe(true)
      expect(cat.components.length).toBeGreaterThan(0)
    }
  })

  it('every component is a non-empty string', () => {
    for (const cat of WARRANTY_COVERAGE_MATRIX) {
      for (const component of cat.components) {
        expect(typeof component).toBe('string')
        expect(component.length).toBeGreaterThan(0)
      }
    }
  })

  it('includes the Engine category', () => {
    const engine = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Engine')
    expect(engine).toBeDefined()
  })

  it('includes the Transmission category', () => {
    const transmission = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Transmission')
    expect(transmission).toBeDefined()
  })

  it('includes the Electrical category', () => {
    const electrical = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Electrical')
    expect(electrical).toBeDefined()
  })

  it('includes the Brakes category', () => {
    const brakes = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Brakes')
    expect(brakes).toBeDefined()
  })

  it('includes the Fuel System category', () => {
    const fuel = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Fuel System')
    expect(fuel).toBeDefined()
  })

  it('includes the Technology & Convenience category', () => {
    const tech = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Technology & Convenience')
    expect(tech).toBeDefined()
  })

  it('Engine category covers at least 8 components', () => {
    const engine = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Engine')!
    expect(engine.components.length).toBeGreaterThanOrEqual(8)
  })

  it('all category names are unique', () => {
    const names = WARRANTY_COVERAGE_MATRIX.map((c) => c.category)
    expect(new Set(names).size).toBe(names.length)
  })

  it('total component count across all categories is greater than 60', () => {
    const total = WARRANTY_COVERAGE_MATRIX.reduce((sum, cat) => sum + cat.components.length, 0)
    expect(total).toBeGreaterThan(60)
  })

  it('Engine category icon is an emoji', () => {
    const engine = WARRANTY_COVERAGE_MATRIX.find((c) => c.category === 'Engine')!
    expect(engine.icon).toBe('⚙️')
  })
})