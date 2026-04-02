import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'price', 'year', 'mileage', 'make', 'model'])
  const rawSort = searchParams.get('sort') || 'created_at'
  const sort = ALLOWED_SORT_COLUMNS.has(rawSort) ? rawSort : 'created_at'
  const order = searchParams.get('order') || 'desc'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const rawLimit = parseInt(searchParams.get('limit') || '20') || 20
  const limit = Math.min(Math.max(1, rawLimit), 100)

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

  // Get aggregations for filters
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('make, body_style, fuel_type, price, year')
    .eq('status', 'available')

  const makes = [...new Set(allVehicles?.map(v => v.make) || [])]
  const bodyStyles = [...new Set(allVehicles?.map(v => v.body_style).filter(Boolean) || [])]
  const fuelTypes = [...new Set(allVehicles?.map(v => v.fuel_type).filter(Boolean) || [])]
  const prices = allVehicles?.map(v => v.price / 100) || []
  const years = allVehicles?.map(v => v.year) || []

  return NextResponse.json({
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
      filters: {
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
      },
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
  const ascending = sort.order === 'asc'
  query = query.order(sort.field, { ascending })

  // Apply pagination
  const startIndex = (pagination.page - 1) * pagination.limit
  query = query.range(startIndex, startIndex + pagination.limit - 1)

  const { data: vehicles, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Get aggregations
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('make, body_style, price')
    .eq('status', 'available')

  return NextResponse.json({
    success: true,
    data: {
      vehicles: vehicles?.map(v => ({
        ...v,
        price: v.price / 100,
        msrp: v.msrp ? v.msrp / 100 : null
      })),
      total: count || 0,
      aggregations: {
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
      },
    },
  })
}
