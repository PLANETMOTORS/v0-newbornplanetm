// Typesense search utilities
// Uses real Typesense Cloud client when configured, falls back to Supabase ilike.

import { createClient } from '@supabase/supabase-js'
import { getSearchClient, isTypesenseConfigured, VEHICLES_COLLECTION } from './typesense/client'

// ── Public interfaces (unchanged) ──────────────────────────────────────────

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

export interface SearchResponse {
  hits: Array<{ document: VehicleSearchResult }>
  found: number
  page: number
  facet_counts?: Array<{
    field_name: string
    counts: Array<{ value: string; count: number }>
  }>
}

// ── Helpers ────────────────────────────────────────────────────────────────

function asArray(value?: string | string[]): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

interface FacetCount {
  value: string
  count: number
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

// ── Typesense filter escaping ──────────────────────────────────────────────

/** Tokens that would break out of a Typesense filter value context. */
const DANGEROUS_FILTER_TOKENS = [']', '&&', '||'] as const

/**
 * Sanitise a single string value for use inside a Typesense `filter_by`
 * expression.  Multi-word values (e.g. "Land Rover") are wrapped in
 * backticks so Typesense treats the whole string as one token.
 *
 * Throws if the value contains filter-syntax tokens that cannot be safely
 * escaped (e.g. `]`, `&&`, `||`).
 */
export function sanitizeTypesenseFilterValue(raw: string): string {
  for (const token of DANGEROUS_FILTER_TOKENS) {
    if (raw.includes(token)) {
      throw new Error(
        `Invalid filter value: contains forbidden token "${token}"`
      )
    }
  }

  // Escape backslashes first (so we don't double-escape the ones we insert for backticks)
  const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`')

  // Always backtick-wrap — safe for single-word values too and required
  // for multi-word values like "Land Rover".
  return '`' + escaped + '`'
}

/**
 * Sanitise an array of values and join them for a Typesense `:[…]` filter.
 * Returns the inner CSV string (without the outer brackets).
 */
function sanitizeFilterValues(values: string[]): string {
  return values.map(sanitizeTypesenseFilterValue).join(',')
}

// ── Body style alias mapping ───────────────────────────────────────────────
// The DB stores values like "Sport Utility" and "4dr Car" but customers
// search for "SUV" and "Sedan". This mapping bridges that gap.
const BODY_STYLE_ALIASES: Record<string, string> = {
  'suv': 'Sport Utility',
  'sedan': '4dr Car',
  'hatchback': 'Hatchback',
  'convertible': 'Convertible',
  'truck': 'Pickup',
  'van': 'Van',
  'wagon': 'Wagon',
  'coupe': 'Coupe',
}

/** Resolve customer-friendly body style names to their DB equivalents. */
function resolveBodyStyleAlias(value: string): string {
  return BODY_STYLE_ALIASES[value.toLowerCase()] || value
}

// ── Typesense search ───────────────────────────────────────────────────────

const FACET_FIELDS = 'make,model,body_style,fuel_type,drivetrain,year,is_ev,is_certified'

function buildFilterBy(params: VehicleSearchParams): string {
  const filters: string[] = ['status:=available']

  const makes = asArray(params.make)
  if (makes.length) filters.push(`make:=[${sanitizeFilterValues(makes)}]`)

  const models = asArray(params.model)
  if (models.length) filters.push(`model:=[${sanitizeFilterValues(models)}]`)

  const bodyStyles = asArray(params.body_style).map(resolveBodyStyleAlias)
  if (bodyStyles.length) filters.push(`body_style:=[${sanitizeFilterValues(bodyStyles)}]`)

  const fuelTypes = asArray(params.fuel_type)
  if (fuelTypes.length) filters.push(`fuel_type:=[${sanitizeFilterValues(fuelTypes)}]`)

  const drivetrains = asArray(params.drivetrain)
  if (drivetrains.length) filters.push(`drivetrain:=[${sanitizeFilterValues(drivetrains)}]`)

  if (typeof params.is_ev === 'boolean') filters.push(`is_ev:=${params.is_ev}`)
  if (typeof params.is_certified === 'boolean') filters.push(`is_certified:=${params.is_certified}`)
  if (typeof params.year_min === 'number') filters.push(`year:>=${params.year_min}`)
  if (typeof params.year_max === 'number') filters.push(`year:<=${params.year_max}`)
  // prices stored in cents in Typesense
  if (typeof params.price_min === 'number') filters.push(`price:>=${params.price_min * 100}`)
  if (typeof params.price_max === 'number') filters.push(`price:<=${params.price_max * 100}`)
  if (typeof params.mileage_max === 'number') filters.push(`mileage:<=${params.mileage_max}`)

  return filters.join(' && ')
}

function mapSortBy(sortBy?: string): string {
  if (!sortBy) return 'created_at:desc'
  // Already in Typesense format (field:direction)
  return sortBy
}

async function searchTypesense(params: VehicleSearchParams): Promise<SearchResponse> {
  const client = getSearchClient()
  if (!client) throw new Error('Typesense client not available')

  const page = Math.max(1, params.page || 1)
  const perPage = Math.min(Math.max(1, params.per_page || 20), 100)

  const result = await client
    .collections(VEHICLES_COLLECTION)
    .documents()
    .search({
      q: params.query || '*',
      query_by: 'make,model,trim,description,vin,stock_number',
      filter_by: buildFilterBy(params),
      sort_by: mapSortBy(params.sort_by),
      facet_by: FACET_FIELDS,
      max_facet_values: 100,
      page,
      per_page: perPage,
      num_typos: 2,
      typo_tokens_threshold: 1,
    })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hits = (result.hits || []).map((hit: any) => {
    const doc = hit.document as Record<string, unknown>
    return {
      document: {
        id: String(doc.id || ''),
        stock_number: String(doc.stock_number || ''),
        year: Number(doc.year || 0),
        make: String(doc.make || ''),
        model: String(doc.model || ''),
        trim: doc.trim ? String(doc.trim) : undefined,
        body_style: doc.body_style ? String(doc.body_style) : undefined,
        exterior_color: doc.exterior_color ? String(doc.exterior_color) : undefined,
        price: Math.round(Number(doc.price || 0) / 100), // cents → dollars
        mileage: Number(doc.mileage || 0),
        drivetrain: doc.drivetrain ? String(doc.drivetrain) : undefined,
        fuel_type: doc.fuel_type ? String(doc.fuel_type) : undefined,
        is_ev: Boolean(doc.is_ev),
        is_certified: Boolean(doc.is_certified),
        status: String(doc.status || 'available'),
        primary_image_url: doc.primary_image_url ? String(doc.primary_image_url) : undefined,
      } as VehicleSearchResult,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const facet_counts = (result.facet_counts || []).map((fc: any) => ({
    field_name: String(fc.field_name),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    counts: (fc.counts || []).map((c: any) => ({
      value: String(c.value),
      count: Number(c.count),
    })),
  }))

  return {
    hits,
    found: result.found,
    page,
    facet_counts,
  }
}

// ── Supabase fallback ──────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

async function searchSupabase(params: VehicleSearchParams): Promise<SearchResponse> {
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
    // Sanitize user input to prevent PostgREST filter injection via commas/parens.
    // Uses the same approach as app/api/v1/vehicles/route.ts (textSearch with tsvector GIN index).
    const sanitizedQ = params.query.trim().slice(0, 200).replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    if (sanitizedQ) {
      query = query.textSearch('search_vector', sanitizedQ, { type: 'websearch', config: 'english' })
    }
  }

  const makes = asArray(params.make)
  if (makes.length > 0) query = query.in('make', makes)

  const modelsArr = asArray(params.model)
  if (modelsArr.length > 0) query = query.in('model', modelsArr)

  const bodyStyles = asArray(params.body_style).map(resolveBodyStyleAlias)
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
    { field_name: 'make', counts: buildFacetCounts(vehicles.map((v) => v.make)) },
    { field_name: 'fuel_type', counts: buildFacetCounts(vehicles.map((v) => v.fuel_type || null)) },
  ]

  return {
    hits: vehicles.map((document) => ({
      document: { ...document, price: Math.round(Number(document.price || 0) / 100) },
    })),
    found: count || 0,
    page,
    facet_counts,
  }
}

// ── Public API (auto-selects backend) ──────────────────────────────────────

export async function searchVehicles(params: VehicleSearchParams): Promise<SearchResponse> {
  if (isTypesenseConfigured()) {
    try {
      return await searchTypesense(params)
    } catch (err) {
      console.error('[Typesense] Search failed, falling back to Supabase:', err)
    }
  }
  return searchSupabase(params)
}

export async function getVehicleFacets() {
  if (isTypesenseConfigured()) {
    try {
      const client = getSearchClient()
      if (client) {
        const result = await client
          .collections(VEHICLES_COLLECTION)
          .documents()
          .search({
            q: '*',
            query_by: 'make',
            filter_by: 'status:=available',
            facet_by: FACET_FIELDS,
            max_facet_values: 100,
            per_page: 0, // we only want facets, not documents
          })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (result.facet_counts || []).map((fc: any) => ({
          field_name: String(fc.field_name),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          counts: (fc.counts || []).map((c: any) => ({
            value: String(c.value),
            count: Number(c.count),
          })),
        }))
      }
    } catch (err) {
      console.error('[Typesense] Facets failed, falling back to Supabase:', err)
    }
  }

  // Supabase fallback
  if (!supabase) return []
  const { data } = await supabase
    .from('vehicles')
    .select('make, fuel_type')
    .eq('status', 'available')
    .limit(5000)

  const rows = data || []
  return [
    { field_name: 'make', counts: buildFacetCounts(rows.map((v) => v.make || null)) },
    { field_name: 'fuel_type', counts: buildFacetCounts(rows.map((v) => v.fuel_type || null)) },
  ]
}
