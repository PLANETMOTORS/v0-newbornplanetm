import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatKm,
  pickFallbackHref,
} from '@/lib/cars/category-helpers'
import type { CategoryFilter } from '@/lib/seo/category-slug-parser'

const baseFilter: Omit<CategoryFilter, 'slug' | 'canonicalPath' | 'h1' | 'metaTitle' | 'metaDescription' | 'shortDescription'> = {}

function makeFilter(overrides: Partial<CategoryFilter> = {}): CategoryFilter {
  return {
    slug: 'electric',
    canonicalPath: '/cars/electric',
    h1: 'EVs',
    metaTitle: 'x',
    metaDescription: 'x',
    shortDescription: 'x',
    ...baseFilter,
    ...overrides,
  }
}

describe('formatPrice', () => {
  it('formats dollar amounts with thousands separator', () => {
    expect(formatPrice(64990)).toBe('$64,990')
    expect(formatPrice(1500)).toBe('$1,500')
    expect(formatPrice(0)).toBe('$0')
  })

  it('drops decimals', () => {
    expect(formatPrice(64990.49)).toBe('$64,990')
    expect(formatPrice(64990.99)).toBe('$64,991')
  })
})

describe('formatKm', () => {
  it('formats kilometers with comma separator and unit suffix', () => {
    expect(formatKm(12000)).toBe('12,000 km')
    expect(formatKm(0)).toBe('0 km')
    expect(formatKm(1)).toBe('1 km')
  })
})

describe('pickFallbackHref', () => {
  it('routes Electric filters to /cars/electric', () => {
    expect(pickFallbackHref(makeFilter({ fuelTypeDb: 'Electric' }))).toBe('/cars/electric')
  })

  it('routes SUV filters to /cars/suv when no fuel match', () => {
    expect(pickFallbackHref(makeFilter({ bodyStyleDb: 'SUV' }))).toBe('/cars/suv')
  })

  it('prefers Electric over SUV when both present', () => {
    expect(
      pickFallbackHref(makeFilter({ fuelTypeDb: 'Electric', bodyStyleDb: 'SUV' })),
    ).toBe('/cars/electric')
  })

  it('routes make filters to /cars/luxury-evs when no fuel/body match', () => {
    expect(pickFallbackHref(makeFilter({ makeSlug: 'tesla' }))).toBe('/cars/luxury-evs')
  })

  it('routes empty filters to /inventory', () => {
    expect(pickFallbackHref(makeFilter())).toBe('/inventory')
  })

  it('routes price-only filters to /inventory', () => {
    expect(pickFallbackHref(makeFilter({ priceMaxDollars: 50000 }))).toBe('/inventory')
  })
})
