import { describe, it, expect } from 'vitest'
import {
  parseCategorySlug,
  enumerateCategorySlugs,
  KNOWN_CITIES,
  SITEMAP_CITY_MAKES,
  SITEMAP_PRIMARY_SLUGS,
} from '@/lib/seo/category-slug-parser'

describe('parseCategorySlug', () => {
  describe('makes', () => {
    it('parses a single-make slug', () => {
      const r = parseCategorySlug('tesla')
      expect(r).not.toBeNull()
      expect(r?.makeSlug).toBe('tesla')
      expect(r?.canonicalPath).toBe('/cars/tesla')
    })

    it('handles plural make slugs', () => {
      const r = parseCategorySlug('teslas')
      expect(r?.makeSlug).toBe('tesla')
    })

    it('parses Mercedes-Benz', () => {
      const r = parseCategorySlug('mercedes-benz')
      expect(r?.makeSlug).toBe('mercedes-benz')
    })

    it('returns null for unknown makes', () => {
      expect(parseCategorySlug('unicorn-motors')).toBeNull()
    })
  })

  describe('fuel types', () => {
    it('parses electric', () => {
      const r = parseCategorySlug('electric')
      expect(r?.fuelTypeDb).toBe('Electric')
    })

    it('parses ev / evs alias', () => {
      expect(parseCategorySlug('ev')?.fuelTypeDb).toBe('Electric')
      expect(parseCategorySlug('evs')?.fuelTypeDb).toBe('Electric')
    })

    it('parses hybrid', () => {
      expect(parseCategorySlug('hybrid')?.fuelTypeDb).toBe('Hybrid')
    })

    it('parses plug-in-hybrid and phev', () => {
      expect(parseCategorySlug('plug-in-hybrid')?.fuelTypeDb).toBe('PHEV')
      expect(parseCategorySlug('phev')?.fuelTypeDb).toBe('PHEV')
    })

    it('parses gas / gasoline / diesel', () => {
      expect(parseCategorySlug('gas')?.fuelTypeDb).toBe('Gasoline')
      expect(parseCategorySlug('gasoline')?.fuelTypeDb).toBe('Gasoline')
      expect(parseCategorySlug('diesel')?.fuelTypeDb).toBe('Diesel')
    })
  })

  describe('body styles', () => {
    it('parses sedan, suv, coupe', () => {
      expect(parseCategorySlug('sedan')?.bodyStyleDb).toBe('Sedan')
      expect(parseCategorySlug('suv')?.bodyStyleDb).toBe('SUV')
      expect(parseCategorySlug('coupe')?.bodyStyleDb).toBe('Coupe')
    })

    it('handles plurals', () => {
      expect(parseCategorySlug('sedans')?.bodyStyleDb).toBe('Sedan')
      expect(parseCategorySlug('suvs')?.bodyStyleDb).toBe('SUV')
    })
  })

  describe('premium tags', () => {
    it('parses luxury-evs', () => {
      const r = parseCategorySlug('luxury-evs')
      expect(r?.fuelTypeDb).toBe('Electric')
      expect(r?.isLuxury).toBe(true)
    })

    it('parses luxury-suvs', () => {
      const r = parseCategorySlug('luxury-suvs')
      expect(r?.bodyStyleDb).toBe('SUV')
      expect(r?.isLuxury).toBe(true)
    })

    it('parses accident-free', () => {
      const r = parseCategorySlug('accident-free')
      expect(r?.isAccidentFree).toBe(true)
    })

    it('parses certified-pre-owned and cpo', () => {
      expect(parseCategorySlug('certified-pre-owned')?.isCertified).toBe(true)
      expect(parseCategorySlug('cpo')?.isCertified).toBe(true)
    })
  })

  describe('two-token combos', () => {
    it('parses electric-suv', () => {
      const r = parseCategorySlug('electric-suv')
      expect(r?.fuelTypeDb).toBe('Electric')
      expect(r?.bodyStyleDb).toBe('SUV')
    })

    it('parses suv-electric (reversed)', () => {
      const r = parseCategorySlug('suv-electric')
      expect(r?.fuelTypeDb).toBe('Electric')
      expect(r?.bodyStyleDb).toBe('SUV')
    })

    it('parses hybrid-sedan', () => {
      const r = parseCategorySlug('hybrid-sedan')
      expect(r?.fuelTypeDb).toBe('Hybrid')
      expect(r?.bodyStyleDb).toBe('Sedan')
    })
  })

  describe('price bands', () => {
    it('parses under-50k', () => {
      const r = parseCategorySlug('under-50k')
      expect(r?.priceMaxDollars).toBe(50000)
    })

    it('parses under-30k', () => {
      const r = parseCategorySlug('under-30k')
      expect(r?.priceMaxDollars).toBe(30000)
    })

    it('parses under-100k', () => {
      const r = parseCategorySlug('under-100k')
      expect(r?.priceMaxDollars).toBe(100000)
    })

    it('rejects nonsense prices', () => {
      expect(parseCategorySlug('under-99999k')).toBeNull()
      expect(parseCategorySlug('under-0k')).toBeNull()
    })
  })

  describe('-in-<city> suffix', () => {
    it('parses electric-in-toronto', () => {
      const r = parseCategorySlug('electric-in-toronto')
      expect(r?.fuelTypeDb).toBe('Electric')
      expect(r?.citySlug).toBe('toronto')
    })

    it('parses tesla-in-richmond-hill (city has hyphen)', () => {
      const r = parseCategorySlug('tesla-in-richmond-hill')
      expect(r?.makeSlug).toBe('tesla')
      expect(r?.citySlug).toBe('richmond-hill')
    })

    it('parses luxury-evs-in-vaughan', () => {
      const r = parseCategorySlug('luxury-evs-in-vaughan')
      expect(r?.isLuxury).toBe(true)
      expect(r?.fuelTypeDb).toBe('Electric')
      expect(r?.citySlug).toBe('vaughan')
    })

    it('rejects unknown cities', () => {
      expect(parseCategorySlug('electric-in-narnia')).toBeNull()
    })

    it('parses under-50k-in-toronto', () => {
      const r = parseCategorySlug('under-50k-in-toronto')
      expect(r?.priceMaxDollars).toBe(50000)
      expect(r?.citySlug).toBe('toronto')
    })
  })

  describe('display fields', () => {
    it('builds H1 for electric in toronto', () => {
      const r = parseCategorySlug('electric-in-toronto')
      expect(r?.h1).toContain('Toronto')
      expect(r?.h1).toContain('Electric')
    })

    it('builds metaTitle for tesla', () => {
      const r = parseCategorySlug('tesla')
      expect(r?.metaTitle).toContain('Tesla')
      expect(r?.metaTitle).toContain('Planet Motors')
    })

    it('includes price clause when capped', () => {
      const r = parseCategorySlug('under-50k-in-vaughan')
      expect(r?.h1).toMatch(/\$50K/i)
      expect(r?.h1).toContain('Vaughan')
    })

    it('canonicalPath always uses parsed slug', () => {
      const r = parseCategorySlug('LUXURY-EVS-in-toronto')
      expect(r?.canonicalPath).toBe('/cars/luxury-evs-in-toronto')
    })
  })

  describe('rejection cases', () => {
    it('returns null for empty', () => {
      expect(parseCategorySlug('')).toBeNull()
    })

    it('returns null for gibberish', () => {
      expect(parseCategorySlug('asdfqwerty')).toBeNull()
      expect(parseCategorySlug('foo-bar-baz')).toBeNull()
    })

    it('returns null for malformed in-X', () => {
      expect(parseCategorySlug('-in-toronto')).toBeNull()
      expect(parseCategorySlug('electric-in-')).toBeNull()
    })
  })
})

describe('enumerateCategorySlugs', () => {
  it('emits at least one slug per primary', () => {
    const slugs = enumerateCategorySlugs()
    for (const p of SITEMAP_PRIMARY_SLUGS) {
      expect(slugs).toContain(p)
    }
  })

  it('emits at least one slug per make', () => {
    const slugs = enumerateCategorySlugs()
    for (const m of SITEMAP_CITY_MAKES) {
      expect(slugs).toContain(m)
    }
  })

  it('emits city crosses for known cities', () => {
    const slugs = enumerateCategorySlugs()
    expect(slugs).toContain('electric-in-toronto')
    expect(slugs).toContain('tesla-in-richmond-hill')
    expect(slugs).toContain('luxury-evs-in-vaughan')
  })

  it('every emitted slug is parseable (no dead URLs in sitemap)', () => {
    const slugs = enumerateCategorySlugs()
    for (const slug of slugs) {
      const parsed = parseCategorySlug(slug)
      expect(parsed, `slug "${slug}" failed to parse`).not.toBeNull()
    }
  })

  it('total count is bounded', () => {
    const slugs = enumerateCategorySlugs()
    const cityCount = Object.keys(KNOWN_CITIES).length
    const expectedMax =
      SITEMAP_PRIMARY_SLUGS.length +
      SITEMAP_CITY_MAKES.length +
      cityCount * (SITEMAP_PRIMARY_SLUGS.length + SITEMAP_CITY_MAKES.length)
    expect(slugs.length).toBeLessThanOrEqual(expectedMax)
    expect(slugs.length).toBeGreaterThan(50)
  })

  it('no duplicate slugs', () => {
    const slugs = enumerateCategorySlugs()
    const set = new Set(slugs)
    expect(set.size).toBe(slugs.length)
  })
})
