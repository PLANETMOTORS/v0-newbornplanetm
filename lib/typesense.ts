// Typesense search utilities - Returns mock data
// Note: Typesense integration disabled - using Supabase directly for vehicle search

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

// Mock search results
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

// Search vehicles - returns mock data (Typesense disabled)
export async function searchVehicles(params: VehicleSearchParams): Promise<SearchResponse> {
  return getMockResults(params)
}

// Get facets for filters - returns mock data
export async function getVehicleFacets() {
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
