import Typesense from 'typesense'
import { getCachedSearchResults, cacheSearchResults } from './redis'
import crypto from 'crypto'

// Typesense client configuration
export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 2,
})

// Vehicle search schema
export const vehicleSchema = {
  name: 'vehicles',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'stock_number', type: 'string' as const },
    { name: 'year', type: 'int32' as const, facet: true },
    { name: 'make', type: 'string' as const, facet: true },
    { name: 'model', type: 'string' as const, facet: true },
    { name: 'trim', type: 'string' as const, optional: true },
    { name: 'body_style', type: 'string' as const, facet: true, optional: true },
    { name: 'exterior_color', type: 'string' as const, facet: true, optional: true },
    { name: 'price', type: 'int32' as const, facet: true },
    { name: 'mileage', type: 'int32' as const, facet: true },
    { name: 'drivetrain', type: 'string' as const, facet: true, optional: true },
    { name: 'fuel_type', type: 'string' as const, facet: true, optional: true },
    { name: 'is_ev', type: 'bool' as const, facet: true },
    { name: 'is_certified', type: 'bool' as const, facet: true },
    { name: 'status', type: 'string' as const, facet: true },
    { name: 'primary_image_url', type: 'string' as const, optional: true },
    { name: 'created_at', type: 'int64' as const },
  ],
  default_sorting_field: 'created_at',
}

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

// Build Typesense filter string from params
function buildFilterString(params: VehicleSearchParams): string {
  const filters: string[] = ['status:=available']

  if (params.make) {
    const makes = Array.isArray(params.make) ? params.make : [params.make]
    filters.push(`make:=[${makes.map(m => `\`${m}\``).join(',')}]`)
  }

  if (params.model) {
    const models = Array.isArray(params.model) ? params.model : [params.model]
    filters.push(`model:=[${models.map(m => `\`${m}\``).join(',')}]`)
  }

  if (params.year_min || params.year_max) {
    const min = params.year_min || 1900
    const max = params.year_max || 2030
    filters.push(`year:>=${min} && year:<=${max}`)
  }

  if (params.price_min || params.price_max) {
    const min = params.price_min || 0
    const max = params.price_max || 999999999
    filters.push(`price:>=${min} && price:<=${max}`)
  }

  if (params.mileage_max) {
    filters.push(`mileage:<=${params.mileage_max}`)
  }

  if (params.body_style) {
    const styles = Array.isArray(params.body_style) ? params.body_style : [params.body_style]
    filters.push(`body_style:=[${styles.map(s => `\`${s}\``).join(',')}]`)
  }

  if (params.fuel_type) {
    const types = Array.isArray(params.fuel_type) ? params.fuel_type : [params.fuel_type]
    filters.push(`fuel_type:=[${types.map(t => `\`${t}\``).join(',')}]`)
  }

  if (params.drivetrain) {
    const drivetrains = Array.isArray(params.drivetrain) ? params.drivetrain : [params.drivetrain]
    filters.push(`drivetrain:=[${drivetrains.map(d => `\`${d}\``).join(',')}]`)
  }

  if (params.is_ev !== undefined) {
    filters.push(`is_ev:=${params.is_ev}`)
  }

  if (params.is_certified !== undefined) {
    filters.push(`is_certified:=${params.is_certified}`)
  }

  return filters.join(' && ')
}

// Generate cache key from search params
function generateCacheKey(params: VehicleSearchParams): string {
  const sorted = JSON.stringify(params, Object.keys(params).sort())
  return crypto.createHash('md5').update(sorted).digest('hex')
}

// Search vehicles with Redis caching
export async function searchVehicles(params: VehicleSearchParams) {
  const cacheKey = generateCacheKey(params)
  
  // Check Redis cache first
  try {
    const cached = await getCachedSearchResults(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    // Redis unavailable, continue without cache
    console.warn('Redis cache unavailable:', error)
  }

  // Search Typesense
  const searchParams = {
    q: params.query || '*',
    query_by: 'make,model,trim,body_style,exterior_color',
    filter_by: buildFilterString(params),
    sort_by: params.sort_by || 'created_at:desc',
    page: params.page || 1,
    per_page: params.per_page || 24,
    facet_by: 'make,model,year,body_style,fuel_type,drivetrain,is_ev',
    max_facet_values: 100,
  }

  const results = await typesenseClient.collections('vehicles').documents().search(searchParams)

  // Cache results in Redis (5 minute TTL)
  try {
    await cacheSearchResults(cacheKey, results, 300)
  } catch (error) {
    console.warn('Failed to cache search results:', error)
  }

  return results
}

// Get facets for filters
export async function getVehicleFacets() {
  const results = await typesenseClient.collections('vehicles').documents().search({
    q: '*',
    query_by: 'make',
    filter_by: 'status:=available',
    facet_by: 'make,model,year,body_style,fuel_type,drivetrain',
    max_facet_values: 100,
    per_page: 0, // We only want facets, not documents
  })

  return results.facet_counts
}
