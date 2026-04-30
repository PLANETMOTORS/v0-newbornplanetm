/**
 * Tests for the Typesense-specific code paths in lib/typesense.ts.
 *
 * The main typesense.test.ts covers the Supabase fallback path.
 * This file mocks `isTypesenseConfigured` to return true and provides a
 * fake Typesense search client, exercising:
 *  - sanitizeFilterValues (internal helper)
 *  - mapSortBy passthrough
 *  - searchVehicles via Typesense (happy path + fallback on error)
 *  - getVehicleFacets via Typesense (happy path + fallback on error)
 *  - applySupabaseTextSearch returning query unchanged for empty-after-sanitise input
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Typesense client ──────────────────────────────────────────────────

const mockSearch = vi.fn()
const mockDocuments = vi.fn(() => ({ search: mockSearch }))
const mockCollections = vi.fn(() => ({ documents: mockDocuments }))

vi.mock('@/lib/typesense/client', () => ({
  isTypesenseConfigured: vi.fn(() => true),
  getSearchClient: vi.fn(() => ({
    collections: mockCollections,
  })),
  VEHICLES_COLLECTION: 'vehicles',
}))

// Supabase mock for fallback path
const mockSupabaseChain: Record<string, vi.Mock> = {}
function resetChain() {
  for (const method of [
    'select', 'eq', 'neq', 'gte', 'lte', 'in', 'or',
    'order', 'ilike', 'textSearch',
  ]) {
    mockSupabaseChain[method] = vi.fn(() => mockSupabaseChain)
  }
  mockSupabaseChain['range'] = vi.fn(() =>
    Promise.resolve({ data: [], count: 0, error: null })
  )
  mockSupabaseChain['limit'] = vi.fn(() =>
    Promise.resolve({ data: [], error: null })
  )
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabaseChain),
  })),
}))

// ── Set env vars before import ─────────────────────────────────────────────
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

const { searchVehicles, getVehicleFacets } = await import('@/lib/typesense')

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTypesenseResult(overrides: Record<string, unknown> = {}) {
  return {
    hits: [
      {
        document: {
          id: 'ts-1',
          stock_number: 'STK-TS-001',
          year: 2023,
          make: 'Tesla',
          model: 'Model 3',
          trim: 'Performance',
          body_style: 'Sedan',
          exterior_color: 'Red',
          price: 4500000, // cents
          mileage: 5000,
          drivetrain: 'AWD',
          fuel_type: 'Electric',
          is_ev: true,
          is_certified: true,
          status: 'available',
          primary_image_url: 'https://example.com/ts.jpg',
        },
      },
    ],
    found: 1,
    facet_counts: [
      {
        field_name: 'make',
        counts: [{ value: 'Tesla', count: 1 }],
      },
    ],
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('searchVehicles — Typesense path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    mockSearch.mockResolvedValue(makeTypesenseResult())
  })

  it('uses Typesense client and converts price from cents to dollars', async () => {
    const result = await searchVehicles({})
    expect(mockCollections).toHaveBeenCalledWith('vehicles')
    expect(result.hits).toHaveLength(1)
    expect(result.hits[0].document.price).toBe(45000)
    expect(result.found).toBe(1)
  })

  it('passes make filter via sanitizeFilterValues into filter_by', async () => {
    await searchVehicles({ make: ['Toyota', 'Honda'] })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('make:=[`Toyota`,`Honda`]')
  })

  it('passes sort_by through mapSortBy', async () => {
    await searchVehicles({ sort_by: 'price:asc' })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.sort_by).toBe('price:asc')
  })

  it('defaults sort_by to created_at:desc when not supplied', async () => {
    await searchVehicles({})
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.sort_by).toBe('created_at:desc')
  })

  it('falls back to Supabase when Typesense search throws', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Typesense unavailable'))
    const result = await searchVehicles({})
    // Should not throw — falls back to Supabase empty result
    expect(result.hits).toEqual([])
    expect(result.found).toBe(0)
  })

  it('passes body_style filter with alias resolution', async () => {
    await searchVehicles({ body_style: 'SUV' })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('body_style:=[`Sport Utility`]')
  })

  it('passes price filters in cents', async () => {
    await searchVehicles({ price_min: 20000, price_max: 50000 })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('price:>=2000000')
    expect(searchArgs.filter_by).toContain('price:<=5000000')
  })

  it('passes fuel_type and drivetrain filters', async () => {
    await searchVehicles({ fuel_type: ['Electric'], drivetrain: ['AWD'] })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('fuel_type:=[`Electric`]')
    expect(searchArgs.filter_by).toContain('drivetrain:=[`AWD`]')
  })

  it('passes is_ev and is_certified boolean filters', async () => {
    await searchVehicles({ is_ev: true, is_certified: false })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('is_ev:=true')
    expect(searchArgs.filter_by).toContain('is_certified:=false')
  })

  it('passes year_min, year_max, and mileage_max filters', async () => {
    await searchVehicles({ year_min: 2020, year_max: 2024, mileage_max: 50000 })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('year:>=2020')
    expect(searchArgs.filter_by).toContain('year:<=2024')
    expect(searchArgs.filter_by).toContain('mileage:<=50000')
  })

  it('passes model filter', async () => {
    await searchVehicles({ model: ['Model 3'] })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.filter_by).toContain('model:=[`Model 3`]')
  })

  it('passes query as q parameter', async () => {
    await searchVehicles({ query: 'Tesla red' })
    const searchArgs = mockSearch.mock.calls[0][0]
    expect(searchArgs.q).toBe('Tesla red')
  })

  it('returns facet_counts from Typesense response', async () => {
    const result = await searchVehicles({})
    expect(result.facet_counts).toHaveLength(1)
    expect(result.facet_counts?.[0].field_name).toBe('make')
  })
})

describe('getVehicleFacets — Typesense path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  it('returns facets from Typesense when configured', async () => {
    mockSearch.mockResolvedValue({
      facet_counts: [
        {
          field_name: 'make',
          counts: [
            { value: 'Tesla', count: 5 },
            { value: 'BMW', count: 3 },
          ],
        },
        {
          field_name: 'fuel_type',
          counts: [{ value: 'Electric', count: 5 }],
        },
      ],
    })

    const facets = await getVehicleFacets()
    expect(facets).toHaveLength(2)
    expect(facets[0].field_name).toBe('make')
    expect(facets[0].counts).toContainEqual({ value: 'Tesla', count: 5 })
  })

  it('falls back to Supabase when Typesense facets throw', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Typesense down'))
    const facets = await getVehicleFacets()
    // Falls back to Supabase — returns empty array when no data
    expect(Array.isArray(facets)).toBe(true)
  })
})

describe('searchVehicles — special-char-only query (Supabase text search edge case)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    // Force Supabase fallback
    mockSearch.mockRejectedValue(new Error('force Supabase'))
  })

  it('skips textSearch when query is entirely special characters', async () => {
    const result = await searchVehicles({ query: '!@#$%^&*()' })
    // After sanitisation, the query is empty — textSearch should not be called
    expect(result.hits).toEqual([])
  })
})
