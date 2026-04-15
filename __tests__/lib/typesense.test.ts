import { describe, it, expect, vi, beforeEach } from 'vitest'

// -------------------------------------------------------------------
// Set env vars before the module is imported (vi.hoisted runs first)
// -------------------------------------------------------------------
const { mockChain, mockCreateClient } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  // Capture arguments passed into each query chain call so tests can
  // assert that the correct values (e.g. price * 100) reach Supabase.
  type CallRecord = { method: string; args: unknown[] }
  const calls: CallRecord[] = []
  let resolveData: unknown[] = []
  let resolveCount = 0
  let limitData: unknown[] = []

  function makeChain(): Record<string, unknown> {
    const chain: Record<string, unknown> = {}
    for (const method of [
      'select', 'eq', 'neq', 'gte', 'lte', 'in', 'or',
      'order', 'ilike',
    ]) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args })
        return makeChain()
      }
    }
    // `range` terminates the chain and resolves the promise
    chain['range'] = (...args: unknown[]) => {
      calls.push({ method: 'range', args })
      return Promise.resolve({ data: resolveData, count: resolveCount, error: null })
    }
    // `limit` terminates the chain and resolves the promise (used by getVehicleFacets)
    chain['limit'] = (...args: unknown[]) => {
      calls.push({ method: 'limit', args })
      return Promise.resolve({ data: limitData, error: null })
    }
    return chain
  }

  const mockChain = {
    calls,
    reset(data: unknown[] = [], count = 0, facets: unknown[] = []) {
      calls.length = 0
      resolveData = data
      resolveCount = count
      limitData = facets
    },
    getCallArgs(method: string) {
      return calls.filter(c => c.method === method).map(c => c.args)
    },
  }

  const clientInstance = { from: vi.fn().mockImplementation(() => makeChain()) }
  const mockCreateClient = vi.fn().mockReturnValue(clientInstance)

  return { mockChain, mockCreateClient }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

// Import after mocks are set up
const { searchVehicles, getVehicleFacets } = await import('@/lib/typesense')

// ---------------------------------------------------------------------------
// Helper: vehicle DB row (price in cents)
// ---------------------------------------------------------------------------
function makeVehicleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'veh-1',
    stock_number: 'STK-001',
    year: 2022,
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE',
    body_style: 'Sedan',
    exterior_color: 'White',
    price: 3000000, // 30 000 CAD in cents
    mileage: 15000,
    drivetrain: 'FWD',
    fuel_type: 'Gasoline',
    is_ev: false,
    is_certified: true,
    status: 'available',
    primary_image_url: 'https://example.com/img.jpg',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// searchVehicles — price conversion
// ---------------------------------------------------------------------------
describe('searchVehicles — price stored in cents, returned in dollars', () => {
  beforeEach(() => mockChain.reset([makeVehicleRow({ price: 2500000 })], 1))

  it('converts price_min from dollars to cents before querying the DB', async () => {
    await searchVehicles({ price_min: 20000 })
    const gteArgs = mockChain.getCallArgs('gte')
    const priceGte = gteArgs.find(a => a[0] === 'price')
    expect(priceGte).toBeDefined()
    expect(priceGte![1]).toBe(20000 * 100)
  })

  it('converts price_max from dollars to cents before querying the DB', async () => {
    await searchVehicles({ price_max: 35000 })
    const lteArgs = mockChain.getCallArgs('lte')
    const priceLte = lteArgs.find(a => a[0] === 'price')
    expect(priceLte).toBeDefined()
    expect(priceLte![1]).toBe(35000 * 100)
  })

  it('returns vehicle price in dollars (divided by 100)', async () => {
    const result = await searchVehicles({})
    expect(result.hits[0].document.price).toBe(25000) // 2 500 000 / 100
  })

  it('rounds fractional cent prices to the nearest dollar', async () => {
    mockChain.reset([makeVehicleRow({ price: 1999950 })], 1) // 19999.50 → 20000
    const result = await searchVehicles({})
    expect(result.hits[0].document.price).toBe(20000)
  })

  it('returns 0 for a vehicle with null/zero price', async () => {
    mockChain.reset([makeVehicleRow({ price: null })], 1)
    const result = await searchVehicles({})
    expect(result.hits[0].document.price).toBe(0)
  })

  it('does not apply price filters when neither price_min nor price_max is supplied', async () => {
    mockChain.reset([], 0)
    await searchVehicles({ query: 'Toyota' })
    const gteArgs = mockChain.getCallArgs('gte').filter(a => a[0] === 'price')
    const lteArgs = mockChain.getCallArgs('lte').filter(a => a[0] === 'price')
    expect(gteArgs).toHaveLength(0)
    expect(lteArgs).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// searchVehicles — pagination
// ---------------------------------------------------------------------------
describe('searchVehicles — pagination', () => {
  beforeEach(() => mockChain.reset([], 0))

  it('uses page 1 and perPage 20 by default', async () => {
    await searchVehicles({})
    const rangeArgs = mockChain.getCallArgs('range')
    expect(rangeArgs[0]).toEqual([0, 19]) // start=0, end=19
  })

  it('calculates correct range for page 2 with default perPage', async () => {
    await searchVehicles({ page: 2 })
    const rangeArgs = mockChain.getCallArgs('range')
    expect(rangeArgs[0]).toEqual([20, 39])
  })

  it('clamps page to minimum of 1 for invalid values', async () => {
    await searchVehicles({ page: -5 })
    const result = await searchVehicles({ page: 0 })
    expect(result.page).toBe(1)
  })

  it('clamps perPage to maximum of 100', async () => {
    await searchVehicles({ per_page: 500 })
    const rangeArgs = mockChain.getCallArgs('range')
    // perPage clamped to 100; start=0, end=99
    expect(rangeArgs[0][1]).toBe(99)
  })

  it('treats per_page=0 as default (falsy → 20) since 0 || 20 = 20', async () => {
    // per_page: 0 is falsy, so `params.per_page || 20` evaluates to 20
    await searchVehicles({ per_page: 0 })
    const rangeArgs = mockChain.getCallArgs('range')
    expect(rangeArgs[0]).toEqual([0, 19]) // start=0, end=19 (perPage=20)
  })

  it('uses perPage=1 when explicitly passed as 1', async () => {
    await searchVehicles({ per_page: 1 })
    const rangeArgs = mockChain.getCallArgs('range')
    expect(rangeArgs[0]).toEqual([0, 0]) // start=0, end=0
  })

  it('returns the page number in the response', async () => {
    const result = await searchVehicles({ page: 3 })
    expect(result.page).toBe(3)
  })

  it('returns the found count from Supabase', async () => {
    mockChain.reset([], 42)
    const result = await searchVehicles({})
    expect(result.found).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// searchVehicles — sorting
// ---------------------------------------------------------------------------
describe('searchVehicles — sort_by', () => {
  beforeEach(() => mockChain.reset([], 0))

  it('defaults to created_at descending', async () => {
    await searchVehicles({})
    const orderArgs = mockChain.getCallArgs('order')
    expect(orderArgs[0]).toEqual(['created_at', { ascending: false }])
  })

  it('sorts by price ascending', async () => {
    await searchVehicles({ sort_by: 'price:asc' })
    const orderArgs = mockChain.getCallArgs('order')
    expect(orderArgs[0]).toEqual(['price', { ascending: true }])
  })

  it('sorts by price descending', async () => {
    await searchVehicles({ sort_by: 'price:desc' })
    const orderArgs = mockChain.getCallArgs('order')
    expect(orderArgs[0]).toEqual(['price', { ascending: false }])
  })

  it('sorts by year descending', async () => {
    await searchVehicles({ sort_by: 'year:desc' })
    const orderArgs = mockChain.getCallArgs('order')
    expect(orderArgs[0]).toEqual(['year', { ascending: false }])
  })

  it('sorts by mileage ascending', async () => {
    await searchVehicles({ sort_by: 'mileage:asc' })
    const orderArgs = mockChain.getCallArgs('order')
    expect(orderArgs[0]).toEqual(['mileage', { ascending: true }])
  })
})

// ---------------------------------------------------------------------------
// searchVehicles — text / attribute filters
// ---------------------------------------------------------------------------
describe('searchVehicles — filters', () => {
  beforeEach(() => mockChain.reset([], 0))

  it('applies or() filter for free-text query across make, model, trim', async () => {
    await searchVehicles({ query: 'Camry' })
    const orArgs = mockChain.getCallArgs('or')
    expect(orArgs[0][0]).toContain('make.ilike.%Camry%')
    expect(orArgs[0][0]).toContain('model.ilike.%Camry%')
    expect(orArgs[0][0]).toContain('trim.ilike.%Camry%')
  })

  it('does not apply or() when query is undefined', async () => {
    await searchVehicles({})
    const orArgs = mockChain.getCallArgs('or')
    expect(orArgs).toHaveLength(0)
  })

  it('applies make filter with a single string value', async () => {
    await searchVehicles({ make: 'Honda' })
    const inArgs = mockChain.getCallArgs('in')
    const makeIn = inArgs.find(a => a[0] === 'make')
    expect(makeIn).toBeDefined()
    expect(makeIn![1]).toEqual(['Honda'])
  })

  it('applies make filter with an array of values', async () => {
    await searchVehicles({ make: ['Toyota', 'Honda'] })
    const inArgs = mockChain.getCallArgs('in')
    const makeIn = inArgs.find(a => a[0] === 'make')
    expect(makeIn![1]).toEqual(['Toyota', 'Honda'])
  })

  it('does not apply make filter when make is not supplied', async () => {
    await searchVehicles({})
    const inArgs = mockChain.getCallArgs('in').filter(a => a[0] === 'make')
    expect(inArgs).toHaveLength(0)
  })

  it('applies year_min filter', async () => {
    await searchVehicles({ year_min: 2020 })
    const gteArgs = mockChain.getCallArgs('gte')
    const yearGte = gteArgs.find(a => a[0] === 'year')
    expect(yearGte![1]).toBe(2020)
  })

  it('applies year_max filter', async () => {
    await searchVehicles({ year_max: 2023 })
    const lteArgs = mockChain.getCallArgs('lte')
    const yearLte = lteArgs.find(a => a[0] === 'year')
    expect(yearLte![1]).toBe(2023)
  })

  it('applies mileage_max filter', async () => {
    await searchVehicles({ mileage_max: 50000 })
    const lteArgs = mockChain.getCallArgs('lte')
    const mileLte = lteArgs.find(a => a[0] === 'mileage')
    expect(mileLte![1]).toBe(50000)
  })

  it('applies is_ev boolean filter', async () => {
    await searchVehicles({ is_ev: true })
    const eqArgs = mockChain.getCallArgs('eq')
    const evEq = eqArgs.find(a => a[0] === 'is_ev')
    expect(evEq![1]).toBe(true)
  })

  it('applies is_certified boolean filter', async () => {
    await searchVehicles({ is_certified: false })
    const eqArgs = mockChain.getCallArgs('eq')
    const certEq = eqArgs.find(a => a[0] === 'is_certified')
    expect(certEq![1]).toBe(false)
  })

  it('applies fuel_type filter with array values', async () => {
    await searchVehicles({ fuel_type: ['Electric', 'Hybrid'] })
    const inArgs = mockChain.getCallArgs('in')
    const ftIn = inArgs.find(a => a[0] === 'fuel_type')
    expect(ftIn![1]).toEqual(['Electric', 'Hybrid'])
  })

  it('applies body_style filter', async () => {
    await searchVehicles({ body_style: 'SUV' })
    const inArgs = mockChain.getCallArgs('in')
    const bsIn = inArgs.find(a => a[0] === 'body_style')
    expect(bsIn![1]).toEqual(['SUV'])
  })

  it('applies drivetrain filter', async () => {
    await searchVehicles({ drivetrain: ['AWD', '4WD'] })
    const inArgs = mockChain.getCallArgs('in')
    const dtIn = inArgs.find(a => a[0] === 'drivetrain')
    expect(dtIn![1]).toEqual(['AWD', '4WD'])
  })

  it('always filters by status = available', async () => {
    await searchVehicles({})
    const eqArgs = mockChain.getCallArgs('eq')
    const statusEq = eqArgs.find(a => a[0] === 'status')
    expect(statusEq![1]).toBe('available')
  })
})

// ---------------------------------------------------------------------------
// searchVehicles — facet_counts
// ---------------------------------------------------------------------------
describe('searchVehicles — facet_counts', () => {
  it('builds make facets from result set, sorted by count descending', async () => {
    mockChain.reset([
      makeVehicleRow({ make: 'Honda' }),
      makeVehicleRow({ make: 'Toyota' }),
      makeVehicleRow({ make: 'Toyota' }),
      makeVehicleRow({ make: 'Honda' }),
      makeVehicleRow({ make: 'BMW' }),
    ], 5)
    const result = await searchVehicles({})
    const makeFacet = result.facet_counts?.find(f => f.field_name === 'make')
    expect(makeFacet).toBeDefined()
    // Toyota (2) > Honda (2) — sort is stable by insertion when counts tie, but
    // the sort is by count descending; both Toyota and Honda have count 2
    const counts = makeFacet!.counts.map(c => c.count)
    expect(counts[0]).toBeGreaterThanOrEqual(counts[counts.length - 1])
    expect(makeFacet!.counts).toContainEqual({ value: 'BMW', count: 1 })
  })

  it('builds fuel_type facets and ignores null fuel_type values', async () => {
    mockChain.reset([
      makeVehicleRow({ fuel_type: 'Electric' }),
      makeVehicleRow({ fuel_type: null }),
      makeVehicleRow({ fuel_type: 'Electric' }),
      makeVehicleRow({ fuel_type: 'Gasoline' }),
    ], 4)
    const result = await searchVehicles({})
    const ftFacet = result.facet_counts?.find(f => f.field_name === 'fuel_type')
    expect(ftFacet).toBeDefined()
    // null should not appear in facet values
    expect(ftFacet!.counts.map(c => c.value)).not.toContain(null)
    expect(ftFacet!.counts).toContainEqual({ value: 'Electric', count: 2 })
    expect(ftFacet!.counts).toContainEqual({ value: 'Gasoline', count: 1 })
  })

  it('returns facet_counts as an array in the response', async () => {
    mockChain.reset([], 0)
    const result = await searchVehicles({})
    expect(Array.isArray(result.facet_counts)).toBe(true)
    expect(result.facet_counts?.length).toBe(2)
  })

  it('returns empty counts arrays when result set is empty', async () => {
    mockChain.reset([], 0)
    const result = await searchVehicles({})
    for (const facet of result.facet_counts ?? []) {
      expect(facet.counts).toHaveLength(0)
    }
  })
})

// ---------------------------------------------------------------------------
// searchVehicles — null Supabase client (env vars not configured)
// ---------------------------------------------------------------------------
describe('searchVehicles — when Supabase is not configured', () => {
  it('returns an empty response without throwing', async () => {
    // Import an isolated copy of the module without env vars
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const mod = await import('@/lib/typesense')
    const result = await mod.searchVehicles({ page: 5 })

    // Restore
    process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey
    vi.resetModules()

    expect(result.hits).toEqual([])
    expect(result.found).toBe(0)
    expect(result.page).toBe(5)
    expect(result.facet_counts).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getVehicleFacets
// ---------------------------------------------------------------------------
describe('getVehicleFacets', () => {
  it('returns make and fuel_type facet fields', async () => {
    // Seed limitData via the third arg so the hoisted mock chain's limit()
    // resolves with this data (no second vi.mock needed).
    const mockData = [
      { make: 'Toyota', fuel_type: 'Gasoline' },
      { make: 'Toyota', fuel_type: 'Gasoline' },
      { make: 'Tesla', fuel_type: 'Electric' },
    ]
    mockChain.reset([], 0, mockData)

    const facets = await getVehicleFacets()

    expect(facets).toHaveLength(2)
    expect(facets[0].field_name).toBe('make')
    expect(facets[1].field_name).toBe('fuel_type')
    expect(facets[0].counts).toContainEqual({ value: 'Toyota', count: 2 })
    expect(facets[1].counts).toContainEqual({ value: 'Electric', count: 1 })
  })

  it('returns empty array when Supabase is not configured', async () => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const mod = await import('@/lib/typesense')
    const result = await mod.getVehicleFacets()

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    vi.resetModules()

    expect(result).toEqual([])
  })
})
