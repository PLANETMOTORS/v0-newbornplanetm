import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'
import { createHash } from 'node:crypto'
import { getDriveeMidFromDb } from '@/lib/drivee-db'
import { applyStatusFilter } from '@/lib/vehicles/status-filter'

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
  'created_at', 'vin', 'is_new_arrival', 'is_certified', 'sold_at',
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
    price: typeof value.price === 'number' && Number.isFinite(value.price) ? value.price / 100 : null,
    msrp: typeof value.msrp === 'number' && Number.isFinite(value.msrp) ? value.msrp / 100 : null,
    drivee_mid: await getDriveeMidFromDb(vin),
  }
}

// 32 hex chars (128 bits) provides ample collision resistance for Redis cache keys
// while keeping key lengths compact compared to the full 64-char digest.
function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32)
}

// ─── Helpers extracted to keep the GET handler's cognitive complexity low ───

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ListParams = ReturnType<typeof parseListParams>
type CursorPair = { id: string | null; createdAt: string | null }

function parseListParams(searchParams: URLSearchParams) {
  const rawSort = searchParams.get('sort') || 'created_at'
  const rawLimit = asInt(searchParams.get('limit'), 20)
  return {
    make: searchParams.get('make'),
    model: searchParams.get('model'),
    minYear: searchParams.get('minYear'),
    maxYear: searchParams.get('maxYear'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    minMileage: searchParams.get('minMileage'),
    maxMileage: searchParams.get('maxMileage'),
    exteriorColor: searchParams.get('exteriorColor'),
    bodyStyle: searchParams.get('bodyStyle'),
    fuelType: searchParams.get('fuelType'),
    transmission: searchParams.get('transmission'),
    drivetrain: searchParams.get('drivetrain'),
    q: searchParams.get('q'),
    status: searchParams.get('status') || 'public',
    sort: ALLOWED_SORT_COLUMNS.has(rawSort) ? rawSort : 'created_at',
    order: searchParams.get('order') || 'desc',
    page: Math.max(1, asInt(searchParams.get('page'), 1)),
    limit: Math.min(Math.max(1, rawLimit), 250),
    includeFilters: searchParams.get('includeFilters') === 'true',
  }
}

// Cursor-based pagination: pass `cursor_id` + `cursor_created_at` to skip
// expensive OFFSET scans on large tables. The composite cursor uses
// (created_at, id) to guarantee stable ordering. PostgREST uses commas and
// parentheses as delimiters, so we strictly validate both values to prevent
// filter-string injection.
function parseAndValidateCursor(searchParams: URLSearchParams):
  | { ok: true; cursor: CursorPair }
  | { ok: false } {
  const rawId = searchParams.get('cursor_id')
  const rawDate = searchParams.get('cursor_created_at')
  const id = rawId && UUID_RE.test(rawId) ? rawId : null
  const createdAt = rawDate && ISO_DATETIME_RE.test(rawDate) ? rawDate : null
  if ((rawId && !id) || (rawDate && !createdAt)) return { ok: false }
  return { ok: true, cursor: { id, createdAt } }
}

function applyNumericRangeFilters<Q extends {
  gte: (col: string, value: number) => Q
  lte: (col: string, value: number) => Q
}>(query: Q, p: ListParams): Q {
  let q = query
  if (p.minYear) q = q.gte('year', Number.parseInt(p.minYear))
  if (p.maxYear) q = q.lte('year', Number.parseInt(p.maxYear))
  if (p.minPrice) q = q.gte('price', Number.parseInt(p.minPrice) * 100)
  if (p.maxPrice) q = q.lte('price', Number.parseInt(p.maxPrice) * 100)
  if (p.minMileage) q = q.gte('mileage', Number.parseInt(p.minMileage))
  if (p.maxMileage) q = q.lte('mileage', Number.parseInt(p.maxMileage))
  return q
}

function applyTextSearchFilter<Q extends {
  textSearch: (col: string, value: string, options: { type: 'websearch'; config: 'english' }) => Q
}>(query: Q, raw: string | null | undefined): Q {
  if (!raw) return query
  const sanitizedQ = raw.trim().slice(0, 200).replaceAll(/[^a-zA-Z0-9\s-]/g, '').trim()
  if (!sanitizedQ) return query
  return query.textSearch('search_vector', sanitizedQ, { type: 'websearch', config: 'english' })
}

function applyVehicleFilters<Q extends {
  ilike: (col: string, value: string) => Q
  textSearch: (col: string, value: string, options: { type: 'websearch'; config: 'english' }) => Q
  gte: (col: string, value: number) => Q
  lte: (col: string, value: number) => Q
}>(query: Q, p: ListParams): Q {
  let q = query
  if (p.make) q = q.ilike('make', p.make)
  if (p.model) q = q.ilike('model', `%${p.model}%`)
  q = applyTextSearchFilter(q, p.q)
  q = applyNumericRangeFilters(q, p)
  if (p.exteriorColor) q = q.ilike('exterior_color', p.exteriorColor)
  if (p.bodyStyle) {
    const aliasPattern = BODY_STYLE_ALIASES[p.bodyStyle.toLowerCase()]
    q = q.ilike('body_style', aliasPattern || p.bodyStyle)
  }
  if (p.fuelType) q = q.ilike('fuel_type', p.fuelType)
  if (p.transmission) q = q.ilike('transmission', `%${p.transmission}%`)
  if (p.drivetrain) q = q.ilike('drivetrain', p.drivetrain)
  return q
}

function mockListResponse() {
  const mockVehicles = getMockVehicles()
  return NextResponse.json({
    success: true,
    data: {
      vehicles: mockVehicles,
      pagination: { page: 1, limit: 20, total: mockVehicles.length, totalPages: 1, hasMore: false },
    },
  }, { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MOCK' } })
}

function hasActiveFilters(p: ListParams): boolean {
  return !!(p.q || p.make || p.model || p.minYear || p.maxYear || p.minPrice || p.maxPrice ||
    p.minMileage || p.maxMileage || p.exteriorColor || p.bodyStyle || p.fuelType ||
    p.transmission || p.drivetrain)
}

type FacetData = {
  makes: string[]
  bodyStyles: string[]
  fuelTypes: string[]
  priceRange: { min: number; max: number }
  yearRange: { min: number; max: number }
}

type Aggregations = {
  makes: { key: string; count: number }[]
  bodyStyles: { key: string; count: number }[]
  priceRanges: { key: string; count: number }[]
}

type AdvancedSearchFilters = {
  makes?: string[]
  bodyStyles?: string[]
  fuelTypes?: string[]
  priceRange?: { min: number; max: number }
  yearRange?: { min: number; max: number }
}

function coerceSearchQuery(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return raw.toString()
  }
  return ''
}

function applySearchQueryFilter<Q extends {
  textSearch: (col: string, value: string, options: { type: 'websearch'; config: 'english' }) => Q
}>(query: Q, raw: unknown): Q {
  const coerced = coerceSearchQuery(raw)
  if (!coerced) return query
  const sanitized = coerced
    .replaceAll('-', ' ')
    .replaceAll(/[^a-zA-Z0-9\s]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
  if (!sanitized) return query
  return query.textSearch('search_vector', sanitized, { type: 'websearch', config: 'english' })
}

function applyAdvancedFilters<Q extends {
  in: (col: string, values: string[]) => Q
  gte: (col: string, value: number) => Q
  lte: (col: string, value: number) => Q
}>(query: Q, filters: AdvancedSearchFilters): Q {
  let q = query
  if (filters.makes?.length) q = q.in('make', filters.makes)
  if (filters.bodyStyles?.length) q = q.in('body_style', filters.bodyStyles)
  if (filters.fuelTypes?.length) q = q.in('fuel_type', filters.fuelTypes)
  if (filters.priceRange) {
    q = q.gte('price', filters.priceRange.min * 100)
    q = q.lte('price', filters.priceRange.max * 100)
  }
  if (filters.yearRange) {
    q = q.gte('year', filters.yearRange.min)
    q = q.lte('year', filters.yearRange.max)
  }
  return q
}

async function computeAndCacheAggregations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  aggCacheKey: string,
): Promise<Aggregations> {
  let aggQuery = supabase.from('vehicles').select('make, body_style, price')
  aggQuery = applyStatusFilter(aggQuery, 'public')
  const { data: allVehicles } = await aggQuery.limit(1000)

  // Price thresholds in cents
  const PRICE_30K_CENTS = 3_000_000
  const PRICE_50K_CENTS = 5_000_000
  const PRICE_75K_CENTS = 7_500_000
  const PRICE_100K_CENTS = 10_000_000

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

  const aggregations: Aggregations = {
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
  return aggregations
}

async function loadOrComputeFacets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  status: string,
): Promise<FacetData> {
  const facetsCacheKey = `vehicles:facets:${status}`
  const cachedFacets = await getCachedSearchResults(facetsCacheKey) as FacetData | null
  if (cachedFacets) return cachedFacets

  let facetQuery = supabase
    .from('vehicles')
    .select('make, body_style, fuel_type, price, year')
  facetQuery = applyStatusFilter(facetQuery, status)
  const { data: allVehicles } = await facetQuery.limit(1000)

  const makes = [...new Set(allVehicles?.map(v => v.make).filter(Boolean) || [])]
  const bodyStyles = [...new Set(allVehicles?.map(v => v.body_style).filter(Boolean) || [])]
  const fuelTypes = [...new Set(allVehicles?.map(v => v.fuel_type).filter(Boolean) || [])]
  const prices = allVehicles?.map(v => (typeof v.price === 'number' && Number.isFinite(v.price) ? v.price / 100 : 0)) || []
  const years = allVehicles?.map(v => v.year) || []

  const filters: FacetData = {
    makes: makes.toSorted((a, b) => a.localeCompare(b)),
    bodyStyles: bodyStyles.toSorted((a, b) => a.localeCompare(b)),
    fuelTypes: fuelTypes.toSorted((a, b) => a.localeCompare(b)),
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 100000,
    },
    yearRange: {
      min: years.length > 0 ? Math.min(...years) : 2018,
      max: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
    },
  }
  await cacheSearchResults(facetsCacheKey, filters, FACETS_TTL)
  return filters
}

function applyCursorOrOffset<Q extends {
  or: (filter: string) => Q
  limit: (n: number) => Q
  range: (from: number, to: number) => Q
}>(
  query: Q,
  params: ListParams,
  cursorId: string | null,
  cursorCreatedAt: string | null,
  ascending: boolean,
): { query: Q; useCursor: boolean } {
  const useCursor = !!(cursorId && cursorCreatedAt && params.sort === 'created_at')
  if (useCursor) {
    const cmp = ascending ? 'gt' : 'lt'
    return {
      query: query
        .or(`created_at.${cmp}.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.${cmp}.${cursorId})`)
        .limit(params.limit),
      useCursor,
    }
  }
  const startIndex = (params.page - 1) * params.limit
  return { query: query.range(startIndex, startIndex + params.limit - 1), useCursor }
}

function handleQueryError(error: { message: string }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return mockListResponse()
}

// GET /api/v1/vehicles - List vehicles with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return mockListResponse()
  }

  const params = parseListParams(searchParams)
  const cursorResult = parseAndValidateCursor(searchParams)
  if (!cursorResult.ok) {
    return NextResponse.json(
      { success: false, error: 'Invalid cursor parameters' },
      { status: 400 }
    )
  }
  const { id: cursorId, createdAt: cursorCreatedAt } = cursorResult.cursor

  const cacheKey = `vehicles:list:${hashKey(searchParams.toString())}`

  const cacheControl = hasActiveFilters(params)
    ? 'private, no-store'
    : `public, s-maxage=${VEHICLE_LIST_TTL}, stale-while-revalidate=${VEHICLE_LIST_TTL * 2}`

  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': cacheControl, 'X-Cache': 'HIT' } })
  }

  let query = supabase.from('vehicles').select(VEHICLE_LIST_FIELDS, { count: 'exact' })
  if (params.status) query = applyStatusFilter(query, params.status)
  query = applyVehicleFilters(query, params)

  const ascending = params.order === 'asc'
  query = query.order(params.sort, { ascending }).order('id', { ascending })

  const cursorApp = applyCursorOrOffset(query, params, cursorId, cursorCreatedAt, ascending)
  query = cursorApp.query
  const useCursor = cursorApp.useCursor

  const { data: vehicles, error, count } = await query

  if (error) return handleQueryError(error)
  if (!vehicles?.length && !process.env.NEXT_PUBLIC_SUPABASE_URL) return mockListResponse()

  const filters: FacetData | undefined = params.includeFilters
    ? await loadOrComputeFacets(supabase, params.status)
    : undefined

  const vehicleList = (await Promise.all((vehicles ?? []).map(toPublicVehicleListItem)))
    .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null)

  const lastRaw = vehicles && vehicles.length > 0 ? vehicles[vehicles.length - 1] : null
  const lastVehicle = lastRaw as unknown as Record<string, unknown> | null
  const nextCursor = lastVehicle
    ? { cursor_id: lastVehicle.id as string, cursor_created_at: lastVehicle.created_at as string }
    : null

  const hasMore = useCursor
    ? vehicleList.length === params.limit
    : (params.page - 1) * params.limit + params.limit < (count || 0)

  const responseBody = {
    success: true,
    data: {
      vehicles: vehicleList,
      pagination: {
        page: params.page, limit: params.limit, total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit), hasMore,
        ...(nextCursor ? { nextCursor } : {}),
      },
      ...(filters ? { filters } : {}),
    },
  }

  await cacheSearchResults(cacheKey, responseBody, VEHICLE_LIST_TTL)

  return NextResponse.json(responseBody, {
    headers: { 'Cache-Control': cacheControl, 'X-Cache': 'MISS' },
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

  // Build base query — include available + reserved + recently-sold (matches GET handler)
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS, { count: 'exact' })
  query = applyStatusFilter(query, 'public')

  // Text search across multiple fields
  query = applySearchQueryFilter(query, searchQuery)

  // Apply filters
  query = applyAdvancedFilters(query, filters)

  // Apply sorting
  const ascending = safeSortOrder === 'asc'
  query = query.order(safeSortField, { ascending })

  // Apply pagination
  const startIndex = (safePage - 1) * safeLimit
  query = query.range(startIndex, startIndex + safeLimit - 1)

  // Run vehicle fetch and aggregation in parallel, with the aggregation served
  // from Redis when available to avoid the repeated full-table scan.
  const aggCacheKey = 'vehicles:aggregations:public'
  const [vehicleResult, cachedAgg] = await Promise.all([
    query,
    getCachedSearchResults(aggCacheKey),
  ])

  const { data: vehicles, error, count } = vehicleResult

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const aggregations: Aggregations = cachedAgg
    ? (cachedAgg as Aggregations)
    : await computeAndCacheAggregations(supabase, aggCacheKey)

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
