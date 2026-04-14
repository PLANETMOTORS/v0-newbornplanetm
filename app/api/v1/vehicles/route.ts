import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'
import { createHash } from 'crypto'

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])

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

function toPublicVehicleListItem(value: unknown): Record<string, unknown> | null {
  if (!isVehicleListRow(value)) {
    return null
  }

  return {
    ...value,
    price: value.price / 100,
    msrp: typeof value.msrp === 'number' ? value.msrp / 100 : null,
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
  const supabase = await createClient()
  
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

  // Build a deterministic cache key from all query params
  const cacheKey = `vehicles:list:${hashKey(searchParams.toString())}`

  // Try Redis cache first
  const cached = await getCachedSearchResults(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': `public, s-maxage=${VEHICLE_LIST_TTL}, stale-while-revalidate=${VEHICLE_LIST_TTL * 2}`,
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
  if (q) query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%,trim.ilike.%${q}%`)
  if (minYear) query = query.gte('year', parseInt(minYear))
  if (maxYear) query = query.lte('year', parseInt(maxYear))
  if (minPrice) query = query.gte('price', parseInt(minPrice) * 100) // Convert to cents
  if (maxPrice) query = query.lte('price', parseInt(maxPrice) * 100)
  if (minMileage) query = query.gte('mileage', parseInt(minMileage))
  if (maxMileage) query = query.lte('mileage', parseInt(maxMileage))
  if (exteriorColor) query = query.ilike('exterior_color', exteriorColor)
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

  const responseBody = {
    success: true,
    data: {
      vehicles: (vehicles ?? [])
        .map(toPublicVehicleListItem)
        .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null),
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

  // Persist to Redis
  await cacheSearchResults(cacheKey, responseBody, VEHICLE_LIST_TTL)

  return NextResponse.json(responseBody, {
    headers: {
      'Cache-Control': `public, s-maxage=${VEHICLE_LIST_TTL}, stale-while-revalidate=${VEHICLE_LIST_TTL * 2}`,
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
    includeAggregations = false,
  } = body

  const safeSortField = ALLOWED_SORT_COLUMNS.has(sort.field) ? sort.field : 'created_at'
  const safeSortOrder = sort.order === 'asc' ? 'asc' : 'desc'
  const safeLimit = Math.min(Math.max(1, asInt(String(pagination.limit || 20), 20)), 100)
  const safePage = Math.max(1, asInt(String(pagination.page || 1), 1))

  // Build base query
  let query = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS, { count: 'exact' })
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
        vehicles: (vehicles ?? [])
          .map(toPublicVehicleListItem)
          .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null),
        total: count || 0,
        aggregations,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=900',
      },
    }
  )
}
