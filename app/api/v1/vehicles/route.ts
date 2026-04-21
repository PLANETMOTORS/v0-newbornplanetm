import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'
import { createHash } from 'crypto'
import { getDriveeMidFromDb } from '@/lib/drivee-db'

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])

// Map customer-friendly body style terms to actual database values.
// The DB stores values like "Sport Utility" and "4dr Car" but customers
// search for "SUV" and "Sedan". This mapping bridges that gap.
const BODY_STYLE_ALIASES: Record<string, string> = {
  'suv': '%Sport Utility%',
  'sedan': '%4dr Car%',
  'hatchback': '%Hatchback%',
  'convertible': '%Convertible%',
  'truck': '%Pickup%',
  'van': '%Van%',
  'wagon': '%Wagon%',
  'coupe': '%Coupe%',
}

// ─── TSVECTOR Full-Text Search (DB Fallback) ────────────────────────────────
// Primary search is handled by Typesense (see /api/typesense and lib/typesense/).
// The vehicles table also has a `search_vector` TSVECTOR column populated by a
// trigger on INSERT/UPDATE. This column is available as a fallback if Typesense
// is unavailable or for server-side search that doesn't need ranking/typo
// tolerance. To use it:
//
//   SELECT * FROM vehicles
//   WHERE search_vector @@ plainto_tsquery('english', 'tesla model 3')
//   ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'tesla model 3')) DESC;
//
// A GIN index on search_vector is created in scripts/001_create_vehicles_schema.sql.
// ─────────────────────────────────────────────────────────────────────────────

// Only fetch the fields the inventory card actually renders — skips large text/JSON columns
const VEHICLE_LIST_FIELDS = [
  'id', 'year', 'make', 'model', 'trim', 'price', 'msrp',
  'mileage', 'fuel_type', 'body_style', 'transmission', 'drivetrain',
  'exterior_color', 'primary_image_url', 'status', 'stock_number',
  'created_at', 'vin', 'is_new_arrival', 'is_certified',
].join(', ')

// TTLs (seconds)
const VEHICLE_LIST_TTL = 300   // 5 minutes
const FACETS_TTL = 600          // 10 minutes

function asInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

type VehicleListRow = Record<string, unknown> & {
  price: number
  msrp?: number | null
}

function isVehicleListRow(value: unknown): value is VehicleListRow {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.price === 'number' && (typeof record.msrp === 'number' || record.msrp === null || record.msrp === undefined)
}

async function toPublicVehicleListItem(value: unknown): Promise<Record<string, unknown> | null> {
  if (!isVehicleListRow(value)) {
    return null
  }

  const vin = typeof value.vin === 'string' ? value.vin : ''

  return {
    ...value,
    price: value.price / 100,
    msrp: typeof value.msrp === 'number' ? value.msrp / 100 : null,
    drivee_mid: await getDriveeMidFromDb(vin),
  }
}

// 32 hex chars (128 bits) provides ample collision resistance for Redis cache keys
// while keeping key lengths compact compared to the full 64-char digest.
function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32)
}

// GET /api/v1/vehicles - List vehicles with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    // Supabase not configured — return mock data for local development
    const mockVehicles = getMockVehicles()
    return NextResponse.json({
      success: true,
      data: {
        vehicles: mockVehicles,
        pagination: { page: 1, limit: 20, total: mockVehicles.length, totalPages: 1, hasMore: false },
      },
    }, { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MOCK' } })
  }

  // Extract filter parameters
  const make = searchParams.get('make')
  const model = searchParams.get('model')
  const minYear = searchParams.get('minYear')
  const maxYear = searchParams.get('maxYear')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minMileage = searchParams.get('minMileage')
  const maxMileage = searchParams.get('maxMileage')
  const exteriorColor = searchParams.get('exteriorColor')
  const bodyStyle = searchParams.get('bodyStyle')
  const fuelType = searchParams.get('fuelType')
  const transmission = searchParams.get('transmission')
  const drivetrain = searchParams.get('drivetrain')
  const q = searchParams.get('q')
  const status = searchParams.get('status') || 'available'
  const rawSort = searchParams.get('sort') || 'created_at'
  const sort = ALLOWED_SORT_COLUMNS.has(rawSort) ? rawSort : 'created_at'
  const order = searchParams.get('order') || 'desc'
  const page = Math.max(1, asInt(searchParams.get('page'), 1))
  const rawLimit = asInt(searchParams.get('limit'), 20)
  const limit = Math.min(Math.max(1, rawLimit), 250)
  const includeFilters = searchParams.get('includeFilters') === 'true'

  // Cursor-based pagination: pass `cursor_id` + `cursor_created_at` to skip
  // expensive OFFSET scans on large tables. When present, these override page-based
  // pagination. The composite cursor uses (created_at, id) to guarantee stable ordering.
  //
  // IMPORTANT: cursor values are interpolated into a PostgREST .or() filter string below.
  // PostgREST uses commas and parentheses as delimiters, so we must strictly validate
  // both values to prevent filter injection (e.g. ",id.neq.0" could bypass the status filter).
  const rawCursorId = searchParams.get('cursor_id')
  const rawCursorCreatedAt = searchParams.get('cursor_created_at')
  const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const cursorId = rawCursorId && UUID_RE.test(rawCursorId) ? rawCursorId : null
  const cursorCreatedAt =
    rawCursorCreatedAt && ISO_DATETIME_RE.test(rawCursorCreatedAt) ? rawCursorCreatedAt : null

  if ((rawCursorId && !cursorId) || (rawCursorCreatedAt && !cursorCreatedAt)) {
    return NextResponse.json(
      { success: false, error: 'Invalid cursor parameters' },
      { status: 400 }
    )
  }

  // Build a deterministic cache key from all query params
  const cacheKey = `vehicles:list:${hashKey(searchParams.toString())}`

  // Requests with search/filter params must NOT be cached at the CDN edge,
  // because different query strings return different results but Netlify Edge
  // may serve a stale response for a different query.  Redis handles caching.
  const hasFilters = !!(q || make || model || minYear || maxYear || minPrice || maxPrice ||
    minMileage || maxMileage || exteriorColor || bodyStyle || fuelType || transmission || drivetrain)
  const cacheControl = hasFilters
    ? 'private, no-store'
    : `public, s-maxage=${VEHICLE_LIST_TTL}, stale-while-revalidate=${VEHICLE_LIST_TTL * 2}`

  // Try Redis cache first
  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache': 'HIT',
      },
    })
  }

  // Build query
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS, { count: 'exact' })

  // Apply filters
  if (status) query = query.eq('status', status)
  if (make) query = query.ilike('make', make)
  if (model) query = query.ilike('model', `%${model}%`)
  if (q) {
    // Use the pre-built tsvector GIN index for safe, efficient full-text search.
    // .or() with user input can be manipulated via special chars (commas, parens).
    const sanitizedQ = q.trim().slice(0, 200).replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    if (sanitizedQ) {
      query = query.textSearch('search_vector', sanitizedQ, { type: 'websearch', config: 'english' })
    }
  }
  if (minYear) query = query.gte('year', parseInt(minYear))
  if (maxYear) query = query.lte('year', parseInt(maxYear))
  if (minPrice) query = query.gte('price', parseInt(minPrice) * 100)
  if (maxPrice) query = query.lte('price', parseInt(maxPrice) * 100)
  if (minMileage) query = query.gte('mileage', parseInt(minMileage))
  if (maxMileage) query = query.lte('mileage', parseInt(maxMileage))
  if (exteriorColor) query = query.ilike('exterior_color', exteriorColor)
  if (bodyStyle) {
    // Map customer-friendly terms (SUV, Sedan) to actual DB values (Sport Utility, 4dr Car)
    const aliasPattern = BODY_STYLE_ALIASES[bodyStyle.toLowerCase()]
    query = query.ilike('body_style', aliasPattern || bodyStyle)
  }
  if (fuelType) query = query.ilike('fuel_type', fuelType)
  if (transmission) query = query.ilike('transmission', `%${transmission}%`)
  if (drivetrain) query = query.ilike('drivetrain', drivetrain)

  // Apply sorting
  const ascending = order === 'asc'
  query = query.order(sort, { ascending })
  // Secondary sort on id guarantees deterministic ordering for cursor pagination
  query = query.order('id', { ascending })

  // Cursor-based pagination: when a cursor is provided, use a composite
  // (created_at, id) filter instead of OFFSET to avoid scanning skipped rows.
  const useCursor = cursorId && cursorCreatedAt && sort === 'created_at'
  if (useCursor) {
    if (ascending) {
      // Next page: created_at > cursor OR (created_at == cursor AND id > cursorId)
      query = query.or(
        `created_at.gt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.gt.${cursorId})`
      )
    } else {
      // Next page (desc): created_at < cursor OR (created_at == cursor AND id < cursorId)
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      )
    }
    query = query.limit(limit)
  } else {
    // Fallback: traditional offset pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)
  }

  const { data: vehicles, error, count } = await query

  if (error) {
    // In production (Supabase configured), surface real errors so callers don't
    // cache or act on fake vehicles. Mock data is only for local dev without env vars.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    const mockVehicles = getMockVehicles()
    return NextResponse.json(
      {
        success: true,
        data: {
          vehicles: mockVehicles,
          pagination: { page: 1, limit: 20, total: mockVehicles.length, totalPages: 1, hasMore: false },
        },
      },
      { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MOCK' } }
    )
  }

  if (!vehicles?.length && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Local dev without Supabase configured: return mock data
    const mockVehicles = getMockVehicles()
    return NextResponse.json(
      {
        success: true,
        data: {
          vehicles: mockVehicles,
          pagination: { page: 1, limit: 20, total: mockVehicles.length, totalPages: 1, hasMore: false },
        },
      },
      { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MOCK' } }
    )
  }

  let filters: {
    makes: string[]
    bodyStyles: string[]
    fuelTypes: string[]
    priceRange: { min: number; max: number }
    yearRange: { min: number; max: number }
  } | undefined

  // Computing facets can be expensive on large inventories, so keep it opt-in.
  // Use a separate Redis cache for facets since they change less frequently.
  if (includeFilters) {
    const facetsCacheKey = `vehicles:facets:${status}`
    const cachedFacets = await getCachedSearchResults(facetsCacheKey) as typeof filters | null

    if (cachedFacets) {
      filters = cachedFacets
    } else {
      const { data: allVehicles } = await supabase
        .from('vehicles')
        .select('make, body_style, fuel_type, price, year')
        .eq('status', status)
        .limit(1000)

      const makes = [...new Set(allVehicles?.map(v => v.make).filter(Boolean) || [])]
      const bodyStyles = [...new Set(allVehicles?.map(v => v.body_style).filter(Boolean) || [])]
      const fuelTypes = [...new Set(allVehicles?.map(v => v.fuel_type).filter(Boolean) || [])]
      const prices = allVehicles?.map(v => v.price / 100) || []
      const years = allVehicles?.map(v => v.year) || []

      filters = {
        makes: makes.sort(),
        bodyStyles: bodyStyles.sort(),
        fuelTypes: fuelTypes.sort(),
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 100000,
        },
        yearRange: {
          min: years.length > 0 ? Math.min(...years) : 2018,
          max: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
        },
      }

      // Cache facets independently with longer TTL
      await cacheSearchResults(facetsCacheKey, filters, FACETS_TTL)
    }
  }

  // Build cursor for the last item so the client can request the next page
  const vehicleList = (await Promise.all((vehicles ?? []).map(toPublicVehicleListItem)))
    .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null)

  const lastRaw = vehicles && vehicles.length > 0 ? vehicles[vehicles.length - 1] : null
  const lastVehicle = lastRaw as unknown as Record<string, unknown> | null
  const nextCursor = lastVehicle
    ? { cursor_id: lastVehicle.id as string, cursor_created_at: lastVehicle.created_at as string }
    : null

  const hasMore = useCursor
    ? vehicleList.length === limit
    : (page - 1) * limit + limit < (count || 0)

  const responseBody = {
    success: true,
    data: {
      vehicles: vehicleList,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore,
        ...(nextCursor ? { nextCursor } : {}),
      },
      ...(filters ? { filters } : {}),
    },
  }

  // Persist to Redis
  await cacheSearchResults(cacheKey, responseBody, VEHICLE_LIST_TTL)

  return NextResponse.json(responseBody, {
    headers: {
      'Cache-Control': cacheControl,
      'X-Cache': 'MISS',
    },
  })
}

// POST /api/v1/vehicles/search - Advanced search
export async function POST(request: NextRequest) {
  const body = await request.json()
  const supabase = await createClient()

  const {
    query: searchQuery,
    filters = {},
    sort = { field: 'created_at', order: 'desc' },
    pagination = { page: 1, limit: 20 },
    includeAggregations: _includeAggregations = false,
  } = body

  const safeSortField = ALLOWED_SORT_COLUMNS.has(sort.field) ? sort.field : 'created_at'
  const safeSortOrder = sort.order === 'asc' ? 'asc' : 'desc'
  const safeLimit = Math.min(Math.max(1, asInt(String(pagination.limit || 20), 20)), 100)
  const safePage = Math.max(1, asInt(String(pagination.page || 1), 1))

  // Cache key for this search
  const cacheKey = `vehicles:search:${hashKey(JSON.stringify({ searchQuery, filters, sort, pagination: { page: safePage, limit: safeLimit } }))}`
  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  // Build base query
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS, { count: 'exact' })
    .eq('status', 'available')

  // Text search across multiple fields
  if (searchQuery) {
    const sanitizedQuery = String(searchQuery).trim().slice(0, 200).replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    if (sanitizedQuery) {
      query = query.textSearch('search_vector', sanitizedQuery, { type: 'websearch', config: 'english' })
    }
  }

  // Apply filters
  if (filters.makes?.length) {
    query = query.in('make', filters.makes)
  }
  if (filters.bodyStyles?.length) {
    query = query.in('body_style', filters.bodyStyles)
  }
  if (filters.fuelTypes?.length) {
    query = query.in('fuel_type', filters.fuelTypes)
  }
  if (filters.priceRange) {
    query = query.gte('price', filters.priceRange.min * 100)
    query = query.lte('price', filters.priceRange.max * 100)
  }
  if (filters.yearRange) {
    query = query.gte('year', filters.yearRange.min)
    query = query.lte('year', filters.yearRange.max)
  }

  // Apply sorting
  const ascending = safeSortOrder === 'asc'
  query = query.order(safeSortField, { ascending })

  // Apply pagination
  const startIndex = (safePage - 1) * safeLimit
  query = query.range(startIndex, startIndex + safeLimit - 1)

  // Run vehicle fetch and aggregation in parallel, with the aggregation served
  // from Redis when available to avoid the repeated full-table scan.
  const aggCacheKey = 'vehicles:aggregations:available'
  const [vehicleResult, cachedAgg] = await Promise.all([
    query,
    getCachedSearchResults(aggCacheKey),
  ])

  const { data: vehicles, error, count } = vehicleResult

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  type Aggregations = {
    makes: { key: string; count: number }[]
    bodyStyles: { key: string; count: number }[]
    priceRanges: { key: string; count: number }[]
  }

  let aggregations: Aggregations

  if (cachedAgg) {
    aggregations = cachedAgg as Aggregations
  } else {
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('make, body_style, price')
      .eq('status', 'available')
      .limit(1000)

    // Price thresholds in cents
    const PRICE_30K_CENTS  = 3_000_000
    const PRICE_50K_CENTS  = 5_000_000
    const PRICE_75K_CENTS  = 7_500_000
    const PRICE_100K_CENTS = 10_000_000

    // Build count maps in a single O(n) pass
    const makeCounts = new Map<string, number>()
    const bodyStyleCounts = new Map<string, number>()
    let under30kCount = 0, from30to50kCount = 0, from50to75kCount = 0, from75to100kCount = 0, over100kCount = 0

    for (const v of allVehicles ?? []) {
      if (v.make) makeCounts.set(v.make, (makeCounts.get(v.make) || 0) + 1)
      if (v.body_style) bodyStyleCounts.set(v.body_style, (bodyStyleCounts.get(v.body_style) || 0) + 1)
      const p = v.price
      if (p < PRICE_30K_CENTS) under30kCount++
      else if (p < PRICE_50K_CENTS) from30to50kCount++
      else if (p < PRICE_75K_CENTS) from50to75kCount++
      else if (p < PRICE_100K_CENTS) from75to100kCount++
      else over100kCount++
    }

    aggregations = {
      makes: Array.from(makeCounts.entries()).map(([key, count]) => ({ key, count })),
      bodyStyles: Array.from(bodyStyleCounts.entries()).map(([key, count]) => ({ key, count })),
      priceRanges: [
        { key: 'Under $30k', count: under30kCount },
        { key: '$30k-$50k', count: from30to50kCount },
        { key: '$50k-$75k', count: from50to75kCount },
        { key: '$75k-$100k', count: from75to100kCount },
        { key: 'Over $100k', count: over100kCount },
      ],
    }

    await cacheSearchResults(aggCacheKey, aggregations, FACETS_TTL)
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        vehicles: (await Promise.all((vehicles ?? []).map(toPublicVehicleListItem)))
          .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null),
        total: count || 0,
        aggregations,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=900',
        'X-Cache': cachedAgg ? 'HIT' : 'MISS',
      },
    }
  )
}


// Mock vehicles for local development when Supabase is unavailable
function getMockVehicles() {
  const raw = [
    { id: "mock-tesla-3", year: 2024, make: "Tesla", model: "Model 3", trim: "Long Range AWD", price: 54995, msrp: 57995, mileage: 8200, fuel_type: "Electric", body_style: "Sedan", transmission: "Automatic", drivetrain: "AWD", exterior_color: "Pearl White", primary_image_url: "/placeholder.jpg", status: "available", stock_number: "PM-2024-001", vin: "5YJ3E1EA1PF000001", is_new_arrival: true, is_certified: true, created_at: new Date().toISOString() },
    { id: "mock-tesla-y", year: 2024, make: "Tesla", model: "Model Y", trim: "Performance", price: 61995, msrp: 63995, mileage: 5100, fuel_type: "Electric", body_style: "SUV", transmission: "Automatic", drivetrain: "AWD", exterior_color: "Midnight Silver", primary_image_url: "/placeholder.jpg", status: "available", stock_number: "PM-2024-002", vin: "5YJ3E1EA1PF000002", is_new_arrival: false, is_certified: true, created_at: new Date().toISOString() },
    { id: "mock-bmw-i4", year: 2023, make: "BMW", model: "i4", trim: "eDrive40", price: 52995, msrp: 56995, mileage: 12300, fuel_type: "Electric", body_style: "Sedan", transmission: "Automatic", drivetrain: "RWD", exterior_color: "Black Sapphire", primary_image_url: "/placeholder.jpg", status: "available", stock_number: "PM-2024-003", vin: "WBA53BJ01PCK00003", is_new_arrival: false, is_certified: true, created_at: new Date().toISOString() },
  ]
  // Attach known Drivee MIDs for testing the 360° viewer locally
  const testMids: Record<string, string> = {
    "mock-tesla-3": "640326639530", // 2019 Tesla Model 3 — 37 frames (1200×900, transparent nobg)
    "mock-tesla-y": "890747363179", // 2024 Tesla Model 3 — 39 frames (1200×900, transparent nobg)
  }
  return raw.map(v => ({ ...v, drivee_mid: testMids[v.id] ?? null }))
}
