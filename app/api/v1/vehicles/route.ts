import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])
const VEHICLE_LIST_FIELDS = [
  'id',
  'stock_number',
  'vin',
  'year',
  'make',
  'model',
  'trim',
  'body_style',
  'exterior_color',
  'interior_color',
  'price',
  'msrp',
  'mileage',
  'drivetrain',
  'transmission',
  'engine',
  'fuel_type',
  'status',
  'location',
  'primary_image_url',
  'is_certified',
  'is_new_arrival',
  'featured',
  'inspection_score',
  'is_ev',
  'battery_capacity_kwh',
  'range_miles',
  'ev_battery_health_percent',
  'created_at',
].join(',')

function asInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

type VehicleListRow = Record<string, unknown> & {
  price: number
  msrp: number | null
}

function isVehicleListRow(value: unknown): value is VehicleListRow {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.price === 'number' && (typeof record.msrp === 'number' || record.msrp === null)
}

function toPublicVehicleListItem(value: unknown): Record<string, unknown> | null {
  if (!isVehicleListRow(value)) {
    return null
  }

  const baseVehicle = Object.fromEntries(Object.entries(value))

  return {
    ...baseVehicle,
    price: value.price / 100,
    msrp: value.msrp === null ? null : value.msrp / 100,
  }
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
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('make, body_style, fuel_type, price, year')
      .eq('status', 'available')
      .limit(5000)

    const all = allVehicles || []
    const makes = buildCountMap(all.map((v) => v.make)).map((entry) => entry.key)
    const bodyStyles = buildCountMap(all.map((v) => v.body_style)).map((entry) => entry.key)
    const fuelTypes = buildCountMap(all.map((v) => v.fuel_type)).map((entry) => entry.key)
    const prices = all.map(v => Number(v.price || 0) / 100).filter((value) => Number.isFinite(value) && value >= 0)
    const years = all.map(v => Number(v.year || 0)).filter((value) => Number.isFinite(value) && value > 0)

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
  }

  return NextResponse.json({
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
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
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

  // Text search across multiple fields using the pre-built tsvector GIN index.
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

  const { data: vehicles, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  let aggregations:
    | {
        makes: Array<{ key: string; count: number }>
        bodyStyles: Array<{ key: string; count: number }>
        priceRanges: Array<{ key: string; count: number }>
      }
    | undefined

  if (includeAggregations) {
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('make, body_style, price')
      .eq('status', 'available')
      .limit(5000)

    const records = allVehicles || []
    aggregations = {
      makes: [...new Set(records.map(v => v.make).filter(Boolean))].map(make => ({
        key: make,
        count: records.filter(v => v.make === make).length,
      })),
      bodyStyles: [...new Set(records.map(v => v.body_style).filter(Boolean))].map(style => ({
        key: style,
        count: records.filter(v => v.body_style === style).length,
      })),
      priceRanges: [
        { key: 'Under $30k', count: records.filter(v => Number(v.price || 0) < 3000000).length },
        { key: '$30k-$50k', count: records.filter(v => Number(v.price || 0) >= 3000000 && Number(v.price || 0) < 5000000).length },
        { key: '$50k-$75k', count: records.filter(v => Number(v.price || 0) >= 5000000 && Number(v.price || 0) < 7500000).length },
        { key: '$75k-$100k', count: records.filter(v => Number(v.price || 0) >= 7500000 && Number(v.price || 0) < 10000000).length },
        { key: 'Over $100k', count: records.filter(v => Number(v.price || 0) >= 10000000).length },
      ],
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        vehicles: (vehicles ?? [])
          .map(toPublicVehicleListItem)
          .filter((vehicle): vehicle is Record<string, unknown> => vehicle !== null),
        total: count || 0,
        ...(aggregations ? { aggregations } : {}),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=900',
      },
    }
  )
}
