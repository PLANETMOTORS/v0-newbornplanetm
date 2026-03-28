// Typesense search utilities - only initializes when env vars are present
// Gracefully degrades to mock data when Typesense is not configured

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

// Check if Typesense is configured
// Note: Typesense package is not installed - always returns false for now
// Install typesense package and set env vars to enable
function isTypesenseConfigured(): boolean {
  // Disabled until typesense package is properly installed
  return false
  // return !!(process.env.TYPESENSE_HOST && process.env.TYPESENSE_API_KEY)
}

// Mock search results for development
function getMockResults(params: VehicleSearchParams): SearchResponse {
  const mockVehicles: VehicleSearchResult[] = [
    {
      id: '1',
      stock_number: 'PM73254025',
      year: 2021,
      make: 'Jeep',
      model: 'Wrangler 4xe',
      trim: 'Unlimited Sahara',
      body_style: 'SUV',
      exterior_color: 'Black',
      price: 52995,
      mileage: 45000,
      drivetrain: '4WD',
      fuel_type: 'Hybrid',
      is_ev: false,
      is_certified: true,
      status: 'available',
      primary_image_url: '/placeholder.svg?height=400&width=600',
    },
    {
      id: '2',
      stock_number: 'PM73254026',
      year: 2023,
      make: 'Tesla',
      model: 'Model Y',
      trim: 'Long Range',
      body_style: 'SUV',
      exterior_color: 'White',
      price: 61990,
      mileage: 12000,
      drivetrain: 'AWD',
      fuel_type: 'Electric',
      is_ev: true,
      is_certified: true,
      status: 'available',
      primary_image_url: '/placeholder.svg?height=400&width=600',
    },
    {
      id: '3',
      stock_number: 'PM73254027',
      year: 2022,
      make: 'BMW',
      model: 'X5',
      trim: 'xDrive40i',
      body_style: 'SUV',
      exterior_color: 'Blue',
      price: 68500,
      mileage: 28000,
      drivetrain: 'AWD',
      fuel_type: 'Gasoline',
      is_ev: false,
      is_certified: true,
      status: 'available',
      primary_image_url: '/placeholder.svg?height=400&width=600',
    },
  ]

  // Simple filtering
  let filtered = mockVehicles
  
  if (params.make) {
    const makes = Array.isArray(params.make) ? params.make : [params.make]
    filtered = filtered.filter(v => makes.includes(v.make))
  }
  
  if (params.is_ev !== undefined) {
    filtered = filtered.filter(v => v.is_ev === params.is_ev)
  }
  
  if (params.price_max) {
    filtered = filtered.filter(v => v.price <= params.price_max!)
  }

  return {
    hits: filtered.map(doc => ({ document: doc })),
    found: filtered.length,
    page: params.page || 1,
    facet_counts: [
      {
        field_name: 'make',
        counts: [
          { value: 'Jeep', count: 1 },
          { value: 'Tesla', count: 1 },
          { value: 'BMW', count: 1 },
        ],
      },
      {
        field_name: 'fuel_type',
        counts: [
          { value: 'Electric', count: 1 },
          { value: 'Hybrid', count: 1 },
          { value: 'Gasoline', count: 1 },
        ],
      },
    ],
  }
}

// Search vehicles - uses Typesense if configured, otherwise returns mock data
export async function searchVehicles(params: VehicleSearchParams): Promise<SearchResponse> {
  if (!isTypesenseConfigured()) {
    return getMockResults(params)
  }

  try {
    const Typesense = (await import('typesense')).default
    
    const client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST!,
          port: parseInt(process.env.TYPESENSE_PORT || '443'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY!,
      connectionTimeoutSeconds: 2,
    })

    const filters: string[] = ['status:=available']

    if (params.make) {
      const makes = Array.isArray(params.make) ? params.make : [params.make]
      filters.push(`make:=[${makes.map(m => `\`${m}\``).join(',')}]`)
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

    if (params.is_ev !== undefined) {
      filters.push(`is_ev:=${params.is_ev}`)
    }

    const searchParams = {
      q: params.query || '*',
      query_by: 'make,model,trim,body_style,exterior_color',
      filter_by: filters.join(' && '),
      sort_by: params.sort_by || 'created_at:desc',
      page: params.page || 1,
      per_page: params.per_page || 24,
      facet_by: 'make,model,year,body_style,fuel_type,drivetrain,is_ev',
      max_facet_values: 100,
    }

    const results = await client.collections('vehicles').documents().search(searchParams)
    return results as SearchResponse
  } catch (error) {
    console.error('Typesense search error:', error)
    return getMockResults(params)
  }
}

// Get facets for filters
export async function getVehicleFacets() {
  if (!isTypesenseConfigured()) {
    return [
      {
        field_name: 'make',
        counts: [
          { value: 'BMW', count: 45 },
          { value: 'Tesla', count: 38 },
          { value: 'Mercedes-Benz', count: 32 },
          { value: 'Audi', count: 28 },
          { value: 'Jeep', count: 25 },
        ],
      },
      {
        field_name: 'fuel_type',
        counts: [
          { value: 'Gasoline', count: 120 },
          { value: 'Electric', count: 45 },
          { value: 'Hybrid', count: 30 },
          { value: 'Diesel', count: 12 },
        ],
      },
    ]
  }

  try {
    const Typesense = (await import('typesense')).default
    
    const client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST!,
          port: parseInt(process.env.TYPESENSE_PORT || '443'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY!,
      connectionTimeoutSeconds: 2,
    })

    const results = await client.collections('vehicles').documents().search({
      q: '*',
      query_by: 'make',
      filter_by: 'status:=available',
      facet_by: 'make,model,year,body_style,fuel_type,drivetrain',
      max_facet_values: 100,
      per_page: 0,
    })

    return results.facet_counts
  } catch {
    return []
  }
}
