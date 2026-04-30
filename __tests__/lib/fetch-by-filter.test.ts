/**
 * Tests for `lib/vehicles/fetch-by-filter.ts`.
 *
 * Mocks Supabase with a fluent stub that records every call so we can
 * verify both the SQL-side filter projection AND the JS-side post-
 * processing (make matching, luxury whitelist, page-size truncation).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CategoryFilter } from '@/lib/seo/category-slug-parser'

/* -------- Supabase chain mock -------- */

interface MockResult {
  data: Array<Record<string, unknown>> | null
  error: { code?: string; message?: string } | null
  count: number | null
}

let mockResult: MockResult = { data: [], error: null, count: 0 }

const mockChain = {
  eq: vi.fn(() => mockChain),
  lte: vi.fn(() => mockChain),
  gte: vi.fn(() => mockChain),
  or: vi.fn(() => mockChain),
  order: vi.fn(() => mockChain),
  limit: vi.fn(() => Promise.resolve(mockResult)),
  select: vi.fn(() => mockChain),
}

const mockFrom = vi.fn(() => mockChain)

vi.mock('@/lib/supabase/static', () => ({
  createStaticClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/vehicles/status-filter', () => ({
  buildPublicStatusFilter: () => 'status.eq.available',
}))

const fetchModuleP = import('@/lib/vehicles/fetch-by-filter')

const ROW = {
  id: 'abc-123',
  year: 2024,
  make: 'Tesla',
  model: 'Model 3',
  trim: 'Long Range',
  body_style: 'Sedan',
  fuel_type: 'Electric',
  price: 6499000, // cents → $64,990
  mileage: 12000,
  primary_image_url: 'https://cdn.example.com/m3.jpg',
  is_ev: true,
  ev_battery_health_percent: 96,
  status: 'available',
}

const ROW_BMW = {
  ...ROW,
  id: 'def-456',
  make: 'BMW',
  model: 'i4',
  body_style: 'Sedan',
  is_ev: true,
  price: 5499000,
}

const ROW_TOYOTA = {
  ...ROW,
  id: 'ghi-789',
  make: 'Toyota',
  model: 'RAV4',
  body_style: 'SUV',
  fuel_type: 'Hybrid',
  is_ev: false,
  ev_battery_health_percent: null,
  price: 3299000,
}

beforeEach(() => {
  vi.clearAllMocks()
  // Re-bind the chain since clearAllMocks resets the mockReturnValue
  mockChain.eq.mockReturnValue(mockChain)
  mockChain.lte.mockReturnValue(mockChain)
  mockChain.gte.mockReturnValue(mockChain)
  mockChain.or.mockReturnValue(mockChain)
  mockChain.order.mockReturnValue(mockChain)
  mockChain.select.mockReturnValue(mockChain)
  mockChain.limit.mockImplementation(() => Promise.resolve(mockResult))
  mockResult = { data: [ROW, ROW_BMW, ROW_TOYOTA], error: null, count: 3 }
})

describe('fetchCategoryVehicles', () => {
  it('queries the vehicles table with public-status filter', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const filter: CategoryFilter = {
      slug: 'electric',
      canonicalPath: '/cars/electric',
      h1: 'Electric Vehicles',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    }
    await fetchCategoryVehicles(filter)
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
    expect(mockChain.or).toHaveBeenCalledWith('status.eq.available')
    expect(mockChain.eq).toHaveBeenCalledWith('fuel_type', 'Electric')
  })

  it('applies body_style filter when bodyStyleDb present', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    await fetchCategoryVehicles({
      slug: 'suv',
      canonicalPath: '/cars/suv',
      h1: 'SUVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      bodyStyleDb: 'SUV',
    })
    expect(mockChain.eq).toHaveBeenCalledWith('body_style', 'SUV')
  })

  it('applies priceMaxDollars filter as cents', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    await fetchCategoryVehicles({
      slug: 'under-50k',
      canonicalPath: '/cars/under-50k',
      h1: 'Under $50K',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      priceMaxDollars: 50000,
    })
    expect(mockChain.lte).toHaveBeenCalledWith('price', 5000000)
  })

  it('applies priceMinDollars filter as cents', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    await fetchCategoryVehicles({
      slug: 'over-50k',
      canonicalPath: '/cars/over-50k',
      h1: 'Over $50K',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      priceMinDollars: 50000,
    })
    expect(mockChain.gte).toHaveBeenCalledWith('price', 5000000)
  })

  it('returns mapped CategoryVehicle objects with dollars (not cents)', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const r = await fetchCategoryVehicles({
      slug: 'electric',
      canonicalPath: '/cars/electric',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles[0].price).toBe(64990)
    expect(r.vehicles[0].make).toBe('Tesla')
    expect(r.vehicles[0].isEv).toBe(true)
  })

  it('applies JS-side make filter using normalizer', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const r = await fetchCategoryVehicles({
      slug: 'tesla',
      canonicalPath: '/cars/tesla',
      h1: 'Teslas',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      makeSlug: 'tesla',
    })
    expect(r.vehicles).toHaveLength(1)
    expect(r.vehicles[0].make).toBe('Tesla')
  })

  it('applies luxury whitelist filter', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const r = await fetchCategoryVehicles({
      slug: 'luxury-evs',
      canonicalPath: '/cars/luxury-evs',
      h1: 'Luxury EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      isLuxury: true,
    })
    // Tesla + BMW are luxury; Toyota is not
    expect(r.vehicles.map((v) => v.make).sort()).toEqual(['BMW', 'Tesla'])
  })

  it('truncates results to pageSize after JS filtering', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    // Fill with many BMW rows so the JS filter passes a lot
    mockResult = {
      data: Array.from({ length: 30 }, (_, i) => ({ ...ROW_BMW, id: `bmw-${i}` })),
      error: null,
      count: 30,
    }
    const r = await fetchCategoryVehicles(
      {
        slug: 'bmw',
        canonicalPath: '/cars/bmw',
        h1: 'BMWs',
        metaTitle: 'x',
        metaDescription: 'x',
        shortDescription: 'x',
        makeSlug: 'bmw',
      },
      5,
    )
    expect(r.vehicles).toHaveLength(5)
    expect(r.totalMatching).toBe(30)
  })

  it('returns empty result on missing-table error (42P01) without throwing', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    mockResult = { data: null, error: { code: '42P01', message: 'no table' }, count: null }
    const r = await fetchCategoryVehicles({
      slug: 'electric',
      canonicalPath: '/cars/electric',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles).toEqual([])
    expect(r.totalMatching).toBe(0)
  })

  it('returns empty result on missing-column error (42703)', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    mockResult = { data: null, error: { code: '42703', message: 'no col' }, count: null }
    const r = await fetchCategoryVehicles({
      slug: 'electric',
      canonicalPath: '/cars/electric',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles).toEqual([])
  })

  it('logs and returns empty for unknown Supabase errors', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockResult = {
      data: null,
      error: { code: '500', message: 'db down' },
      count: null,
    }
    const r = await fetchCategoryVehicles({
      slug: 'electric',
      canonicalPath: '/cars/electric',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles).toEqual([])
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('handles thrown exceptions gracefully', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockChain.limit.mockImplementationOnce(() => {
      throw new Error('network')
    })
    const r = await fetchCategoryVehicles({
      slug: 'electric-thrown',
      canonicalPath: '/cars/electric-thrown',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles).toEqual([])
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('handles null price column by defaulting to 0', async () => {
    const { fetchCategoryVehicles } = await fetchModuleP
    mockResult = {
      data: [{ ...ROW, price: null, mileage: null }],
      error: null,
      count: 1,
    }
    const r = await fetchCategoryVehicles({
      slug: 'electric-null',
      canonicalPath: '/cars/electric-null',
      h1: 'EVs',
      metaTitle: 'x',
      metaDescription: 'x',
      shortDescription: 'x',
      fuelTypeDb: 'Electric',
    })
    expect(r.vehicles[0].price).toBe(0)
    expect(r.vehicles[0].mileage).toBe(0)
  })
})
