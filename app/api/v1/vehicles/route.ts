import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'
import { createHash } from 'crypto'

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])

// TTLs (seconds)
const VEHICLE_LIST_TTL = 300   // 5 minutes
const FACETS_TTL = 600          // 10 minutes

function asInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
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
  if (includeFilters) {
    const facetsCacheKey = `vehicles:facets:${status}`
    const cachedFacets = await getCachedSearchResults(facetsCacheKey) as typeof filters | null

    if (cachedFacets) {
      filters = cachedFacets
    } else {
      const { data: allVehicles } = await supabase
        .from('vehicles')
        .select('make, body_style, fuel_type, price, year')
        .eq('status', 'available')
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
  } = body

  const safeSortField = ALLOWED_SORT_COLUMNS.has(sort.field) ? sort.field : 'created_at'
  const safeSortOrder = sort.order === 'asc' ? 'asc' : 'desc'
  const safeLimit = Math.min(Math.max(1, asInt(String(pagination.limit || 20), 20)), 100)
  const safePage = Math.max(1, asInt(String(pagination.page || 1), 1))

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

    aggregations = {
      makes: [...new Set(allVehicles?.map(v => v.make) || [])].map(make => ({
        key: make,
        count: allVehicles?.filter(v => v.make === make).length || 0,
      })),
      bodyStyles: [...new Set(allVehicles?.map(v => v.body_style).filter(Boolean) || [])].map(style => ({
        key: style,
        count: allVehicles?.filter(v => v.body_style === style).length || 0,
      })),
      priceRanges: [
        { key: 'Under $30k', count: allVehicles?.filter(v => v.price < 3000000).length || 0 },
        { key: '$30k-$50k', count: allVehicles?.filter(v => v.price >= 3000000 && v.price < 5000000).length || 0 },
        { key: '$50k-$75k', count: allVehicles?.filter(v => v.price >= 5000000 && v.price < 7500000).length || 0 },
        { key: '$75k-$100k', count: allVehicles?.filter(v => v.price >= 7500000 && v.price < 10000000).length || 0 },
        { key: 'Over $100k', count: allVehicles?.filter(v => v.price >= 10000000).length || 0 },
      ],
    }

    await cacheSearchResults(aggCacheKey, aggregations, FACETS_TTL)
  }

  return NextResponse.json({
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
  })
}
