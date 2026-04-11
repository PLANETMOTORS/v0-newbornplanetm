// Typesense search utilities
// Note: Typesense integration is disabled; this module now proxies to Supabase search.

import { createClient } from '@supabase/supabase-js'

export interface VehicleSearchParams {
  query?: string
  make?: string | string[]
  model?: string | string[]
  year_min?: number
  year_max?: number
  price_min?: number
  price_max?: number
  mileage_max?: number
  body_style?: string | string[]
  fuel_type?: string | string[]
  drivetrain?: string | string[]
  is_ev?: boolean
  is_certified?: boolean
  sort_by?: 'price:asc' | 'price:desc' | 'mileage:asc' | 'year:desc' | 'created_at:desc'
  page?: number
  per_page?: number
}

export interface VehicleSearchResult {
  id: string
  stock_number: string
  year: number
  make: string
  model: string
  trim?: string
  body_style?: string
  exterior_color?: string
  price: number
  mileage: number
  drivetrain?: string
  fuel_type?: string
  is_ev: boolean
  is_certified: boolean
  status: string
  primary_image_url?: string
}

interface SearchResponse {
  hits: Array<{ document: VehicleSearchResult }>
  found: number
  page: number
  facet_counts?: Array<{
    field_name: string
    counts: Array<{ value: string; count: number }>
  }>
}

interface FacetCount {
  value: string
  count: number
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

function asArray(value?: string | string[]): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function buildFacetCounts(values: Array<string | null | undefined>): FacetCount[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (!value) continue
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

export async function searchVehicles(params: VehicleSearchParams): Promise<SearchResponse> {
  if (!supabase) {
    return { hits: [], found: 0, page: params.page || 1, facet_counts: [] }
  }

  const page = Math.max(1, params.page || 1)
  const perPage = Math.min(Math.max(1, params.per_page || 20), 100)
  const start = (page - 1) * perPage
  const end = start + perPage - 1

  let query = supabase
    .from('vehicles')
    .select('id, stock_number, year, make, model, trim, body_style, exterior_color, price, mileage, drivetrain, fuel_type, is_ev, is_certified, status, primary_image_url', { count: 'exact' })
    .eq('status', 'available')

  if (params.query) {
    query = query.or(`make.ilike.%${params.query}%,model.ilike.%${params.query}%,trim.ilike.%${params.query}%`)
  }

  const makes = asArray(params.make)
  if (makes.length > 0) query = query.in('make', makes)

  const models = asArray(params.model)
  if (models.length > 0) query = query.in('model', models)

  const bodyStyles = asArray(params.body_style)
  if (bodyStyles.length > 0) query = query.in('body_style', bodyStyles)

  const fuelTypes = asArray(params.fuel_type)
  if (fuelTypes.length > 0) query = query.in('fuel_type', fuelTypes)

  const drivetrains = asArray(params.drivetrain)
  if (drivetrains.length > 0) query = query.in('drivetrain', drivetrains)

  if (typeof params.is_ev === 'boolean') query = query.eq('is_ev', params.is_ev)
  if (typeof params.is_certified === 'boolean') query = query.eq('is_certified', params.is_certified)
  if (typeof params.year_min === 'number') query = query.gte('year', params.year_min)
  if (typeof params.year_max === 'number') query = query.lte('year', params.year_max)
  if (typeof params.price_min === 'number') query = query.gte('price', params.price_min * 100)
  if (typeof params.price_max === 'number') query = query.lte('price', params.price_max * 100)
  if (typeof params.mileage_max === 'number') query = query.lte('mileage', params.mileage_max)

  const [sortField, sortDirection] = (params.sort_by || 'created_at:desc').split(':') as [string, 'asc' | 'desc']
  query = query.order(sortField, { ascending: sortDirection === 'asc' })

  const { data, count } = await query.range(start, end)
  const vehicles = (data || []) as VehicleSearchResult[]

  const facet_counts = [
    {
      field_name: 'make',
      counts: buildFacetCounts(vehicles.map((vehicle) => vehicle.make)),
    },
    {
      field_name: 'fuel_type',
      counts: buildFacetCounts(vehicles.map((vehicle) => vehicle.fuel_type || null)),
    },
  ]

  return {
    hits: vehicles.map((document) => ({
      document: {
        ...document,
        price: Math.round(Number(document.price || 0) / 100),
      },
    })),
    found: count || 0,
    page,
    facet_counts,
  }
}

export async function getVehicleFacets() {
  if (!supabase) {
    return []
  }

  const { data } = await supabase
    .from('vehicles')
    .select('make, fuel_type')
    .eq('status', 'available')
    .limit(5000)

  const rows = data || []
  return [
    {
      field_name: 'make',
      counts: buildFacetCounts(rows.map((vehicle) => vehicle.make || null)),
    },
    {
      field_name: 'fuel_type',
      counts: buildFacetCounts(rows.map((vehicle) => vehicle.fuel_type || null)),
    },
  ]
}
