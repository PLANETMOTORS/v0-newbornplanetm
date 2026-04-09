import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'
import { createHash } from 'crypto'

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])

// Cache TTLs in seconds
const VEHICLE_LIST_TTL = 60       // 1 minute for paginated results
const FACETS_TTL = 300            // 5 minutes for filter facets

function asInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function hashParams(params: Record<string, unknown>): string {
  // Normalize: remove null/undefined and sort keys for deterministic hashing
  const normalized = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
  )
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 16)
}

// GET /api/v1/vehicles - List vehicles with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()
  
  // Extract filter parameters
  const make = searchParams.get('make')
  const model = searchParams.get('model')
  const minYear = searchParams.get('minYear')
  const maxYear = searchParams.get('maxYear')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const bodyStyle = searchParams.get('bodyStyle')
  const fuelType = searchParams.get('fuelType')
  const transmission = searchParams.get('transmission')
  const drivetrain = searchParams.get('drivetrain')
  const status = searchParams.get('status') || 'available'
  const rawSort = searchParams.get('sort') || 'created_at'
  const sort = ALLOWED_SORT_COLUMNS.has(rawSort) ? rawSort : 'created_at'
  const order = searchParams.get('order') || 'desc'
  const page = Math.max(1, asInt(searchParams.get('page'), 1))
  const rawLimit = asInt(searchParams.get('limit'), 20)
  const limit = Math.min(Math.max(1, rawLimit), 100)
  const includeFilters = searchParams.get('includeFilters') === 'true'

  // Build a cache key from all query params
  const cacheParams = { make, model, minYear, maxYear, minPrice, maxPrice, bodyStyle, fuelType, transmission, drivetrain, status, sort, order, page, limit, includeFilters }
  const cacheKey = `vehicles:list:${hashParams(cacheParams)}`

  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
      },
    })
  }

  // Build query
  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })

  // Apply filters
  if (status) query = query.eq('status', status)
  if (make) query = query.ilike('make', make)
  if (model) query = query.ilike('model', `%${model}%`)
  if (minYear) query = query.gte('year', parseInt(minYear))
  if (maxYear) query = query.lte('year', parseInt(maxYear))
  if (minPrice) query = query.gte('price', parseInt(minPrice) * 100) // Convert to cents
  if (maxPrice) query = query.lte('price', parseInt(maxPrice) * 100)
  if (bodyStyle) query = query.ilike('body_style', bodyStyle)
  if (fuelType) query = query.ilike('fuel_type', fuelType)
  if (transmission) query = query.ilike('transmission', `%${transmission}%`)
  if (drivetrain) query = query.ilike('drivetrain', drivetrain)

  // Apply sorting
  const ascending = order === 'asc'
  query = query.order(sort, { ascending })

  // Apply pagination
  const startIndex = (page - 1) * limit
  query = query.range(startIndex, startIndex + limit - 1)

  const { data: vehicles, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
    const facetsCacheKey = 'vehicles:facets:available'
    const cachedFacets = await getCachedSearchResults(facetsCacheKey)

    if (cachedFacets && typeof cachedFacets === 'object' && 'makes' in cachedFacets) {
      filters = cachedFacets as typeof filters
    } else {
      // Use SQL aggregations instead of fetching all rows into JS
      const [makesRes, bodyStylesRes, fuelTypesRes, minPriceRes, maxPriceRes, minYearRes, maxYearRes] = await Promise.all([
        // Limit to 200: covers any realistic vehicle inventory (200 distinct makes is far above real world).
        // If the limit is ever approached, results will be silently truncated; add an alert if
        // `makesRes.data?.length === 200` is observed in production logs.
        supabase.from('vehicles').select('make').eq('status', 'available').not('make', 'is', null).order('make').limit(200),
        supabase.from('vehicles').select('body_style').eq('status', 'available').not('body_style', 'is', null).order('body_style').limit(200),
        supabase.from('vehicles').select('fuel_type').eq('status', 'available').not('fuel_type', 'is', null).order('fuel_type').limit(200),
        supabase.from('vehicles').select('price').eq('status', 'available').order('price', { ascending: true }).limit(1),
        supabase.from('vehicles').select('price').eq('status', 'available').order('price', { ascending: false }).limit(1),
        supabase.from('vehicles').select('year').eq('status', 'available').order('year', { ascending: true }).limit(1),
        supabase.from('vehicles').select('year').eq('status', 'available').order('year', { ascending: false }).limit(1),
      ])

      const makes = [...new Set(makesRes.data?.map(v => v.make) || [])].sort() as string[]
      const bodyStyles = [...new Set(bodyStylesRes.data?.map(v => v.body_style) || [])].sort() as string[]
      const fuelTypes = [...new Set(fuelTypesRes.data?.map(v => v.fuel_type) || [])].sort() as string[]

      filters = {
        makes,
        bodyStyles,
        fuelTypes,
        priceRange: {
          min: minPriceRes.data?.[0]?.price != null ? minPriceRes.data[0].price / 100 : 0,
          max: maxPriceRes.data?.[0]?.price != null ? maxPriceRes.data[0].price / 100 : 100000,
        },
        yearRange: {
          min: minYearRes.data?.[0]?.year ?? 2018,
          max: maxYearRes.data?.[0]?.year ?? new Date().getFullYear(),
        },
      }

      await cacheSearchResults(facetsCacheKey, filters, FACETS_TTL)
    }
  }

  const responseBody = {
    success: true,
    data: {
      vehicles: vehicles?.map(v => ({
        ...v,
        price: v.price / 100, // Convert from cents to dollars
        msrp: v.msrp ? v.msrp / 100 : null
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: startIndex + limit < (count || 0),
      },
      ...(filters ? { filters } : {}),
    },
  }

  await cacheSearchResults(cacheKey, responseBody, VEHICLE_LIST_TTL)

  return NextResponse.json(responseBody, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
  } = body

  const safeSortField = ALLOWED_SORT_COLUMNS.has(sort.field) ? sort.field : 'created_at'
  const safeSortOrder = sort.order === 'asc' ? 'asc' : 'desc'
  const safeLimit = Math.min(Math.max(1, asInt(String(pagination.limit || 20), 20)), 100)
  const safePage = Math.max(1, asInt(String(pagination.page || 1), 1))

  // Cache key for this search
  const cacheKey = `vehicles:search:${hashParams({ searchQuery, filters, sort, pagination: { page: safePage, limit: safeLimit } })}`
  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  // Build base query
  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('status', 'available')

  // Text search across multiple fields
  if (searchQuery) {
    query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,trim.ilike.%${searchQuery}%`)
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

  const [{ data: vehicles, error, count }, aggregationsResult] = await Promise.all([
    query,
    // Use a Redis-cached RPC call for aggregations to avoid repeated full-table scans.
    // The RPC function uses DB-level GROUP BY / COUNT, which is far more efficient than
    // fetching all rows. Cache TTL matches FACETS_TTL (5 minutes).
    getCachedSearchResults('vehicles:search:aggregations').then(async (hit) => {
      if (hit) return hit
      const { data } = await supabase.rpc('get_vehicle_aggregations')
      if (data) {
        await cacheSearchResults('vehicles:search:aggregations', data, FACETS_TTL)
      }
      return data ?? null
    }),
  ])

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  type AggregationResult = {
    makes: Array<{ key: string; count: number }>
    bodyStyles: Array<{ key: string; count: number }>
    priceRanges: Array<{ key: string; count: number }>
  }

  const aggregations = (aggregationsResult as AggregationResult | null) ?? {
    makes: [],
    bodyStyles: [],
    priceRanges: [],
  }

  const responseBody = {
    success: true,
    data: {
      vehicles: vehicles?.map(v => ({
        ...v,
        price: v.price / 100,
        msrp: v.msrp ? v.msrp / 100 : null
      })),
      total: count || 0,
      aggregations,
    },
  }

  await cacheSearchResults(cacheKey, responseBody, VEHICLE_LIST_TTL)

  return NextResponse.json(responseBody, {
    headers: { 'X-Cache': 'MISS' },
  })
}
