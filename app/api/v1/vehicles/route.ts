import { NextRequest, NextResponse } from 'next/server'

// Mock vehicle data - replace with database queries
const vehicles = [
  {
    id: 'v-001',
    vin: '1HGBH41JXMN109186',
    year: 2023,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
    price: 34999,
    mileage: 15420,
    exteriorColor: 'Crystal Black Pearl',
    interiorColor: 'Black',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    engine: '1.5L Turbo I4',
    bodyStyle: 'Sedan',
    doors: 4,
    seats: 5,
    status: 'available',
    inspectionStatus: 'passed',
    inspectionScore: 98,
    location: 'Richmond Hill Hub',
    photos: ['/vehicles/accord-1.jpg', '/vehicles/accord-2.jpg'],
    features: ['Apple CarPlay', 'Android Auto', 'Heated Seats', 'Sunroof'],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'v-002',
    vin: '5YJSA1E26MF123456',
    year: 2022,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range',
    price: 49999,
    mileage: 22150,
    exteriorColor: 'Pearl White',
    interiorColor: 'Black',
    fuelType: 'Electric',
    transmission: 'Single Speed',
    drivetrain: 'AWD',
    engine: 'Dual Motor Electric',
    bodyStyle: 'Sedan',
    doors: 4,
    seats: 5,
    status: 'available',
    inspectionStatus: 'passed',
    inspectionScore: 99,
    location: 'Richmond Hill Hub',
    evBatteryHealth: 94,
    evRange: 545,
    photos: ['/vehicles/model3-1.jpg', '/vehicles/model3-2.jpg'],
    features: ['Autopilot', 'Premium Audio', 'Glass Roof', 'Supercharger Access'],
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'v-003',
    vin: '1C4RJFBG5LC123456',
    year: 2021,
    make: 'Jeep',
    model: 'Grand Cherokee',
    trim: 'Limited',
    price: 44999,
    mileage: 35200,
    exteriorColor: 'Diamond Black',
    interiorColor: 'Tan Leather',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    engine: '3.6L V6',
    bodyStyle: 'SUV',
    doors: 4,
    seats: 5,
    status: 'available',
    inspectionStatus: 'passed',
    inspectionScore: 96,
    location: 'Richmond Hill Hub',
    photos: ['/vehicles/cherokee-1.jpg', '/vehicles/cherokee-2.jpg'],
    features: ['Navigation', 'Leather Seats', 'Panoramic Sunroof', 'Tow Package'],
    createdAt: '2024-01-08T10:00:00Z',
  },
]

// GET /api/v1/vehicles - List vehicles with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
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
  const sort = searchParams.get('sort') || 'createdAt'
  const order = searchParams.get('order') || 'desc'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Filter vehicles
  let filtered = vehicles.filter((v) => {
    if (status && v.status !== status) return false
    if (make && v.make.toLowerCase() !== make.toLowerCase()) return false
    if (model && !v.model.toLowerCase().includes(model.toLowerCase())) return false
    if (minYear && v.year < parseInt(minYear)) return false
    if (maxYear && v.year > parseInt(maxYear)) return false
    if (minPrice && v.price < parseInt(minPrice)) return false
    if (maxPrice && v.price > parseInt(maxPrice)) return false
    if (bodyStyle && v.bodyStyle.toLowerCase() !== bodyStyle.toLowerCase()) return false
    if (fuelType && v.fuelType.toLowerCase() !== fuelType.toLowerCase()) return false
    if (transmission && v.transmission.toLowerCase() !== transmission.toLowerCase()) return false
    if (drivetrain && v.drivetrain.toLowerCase() !== drivetrain.toLowerCase()) return false
    return true
  })

  // Sort vehicles
  filtered.sort((a, b) => {
    const aVal = a[sort as keyof typeof a]
    const bVal = b[sort as keyof typeof b]
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  // Paginate
  const startIndex = (page - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit)

  return NextResponse.json({
    success: true,
    data: {
      vehicles: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
        hasMore: startIndex + limit < filtered.length,
      },
      filters: {
        makes: [...new Set(vehicles.map((v) => v.make))],
        bodyStyles: [...new Set(vehicles.map((v) => v.bodyStyle))],
        fuelTypes: [...new Set(vehicles.map((v) => v.fuelType))],
        priceRange: {
          min: Math.min(...vehicles.map((v) => v.price)),
          max: Math.max(...vehicles.map((v) => v.price)),
        },
        yearRange: {
          min: Math.min(...vehicles.map((v) => v.year)),
          max: Math.max(...vehicles.map((v) => v.year)),
        },
      },
    },
  })
}

// POST /api/v1/vehicles/search - Advanced search
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const {
    query,
    filters = {},
    sort = { field: 'relevance', order: 'desc' },
    pagination = { page: 1, limit: 20 },
  } = body

  // Simulate OpenSearch-style search
  let results = vehicles

  // Text search across multiple fields
  if (query) {
    const q = query.toLowerCase()
    results = results.filter((v) => 
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.trim.toLowerCase().includes(q) ||
      v.bodyStyle.toLowerCase().includes(q) ||
      v.features.some((f) => f.toLowerCase().includes(q))
    )
  }

  // Apply filters
  if (filters.makes?.length) {
    results = results.filter((v) => filters.makes.includes(v.make))
  }
  if (filters.bodyStyles?.length) {
    results = results.filter((v) => filters.bodyStyles.includes(v.bodyStyle))
  }
  if (filters.fuelTypes?.length) {
    results = results.filter((v) => filters.fuelTypes.includes(v.fuelType))
  }
  if (filters.priceRange) {
    results = results.filter((v) => 
      v.price >= filters.priceRange.min && v.price <= filters.priceRange.max
    )
  }
  if (filters.yearRange) {
    results = results.filter((v) => 
      v.year >= filters.yearRange.min && v.year <= filters.yearRange.max
    )
  }

  // Pagination
  const startIndex = (pagination.page - 1) * pagination.limit
  const paginated = results.slice(startIndex, startIndex + pagination.limit)

  return NextResponse.json({
    success: true,
    data: {
      vehicles: paginated,
      total: results.length,
      aggregations: {
        makes: [...new Set(results.map((v) => v.make))].map((make) => ({
          key: make,
          count: results.filter((v) => v.make === make).length,
        })),
        bodyStyles: [...new Set(results.map((v) => v.bodyStyle))].map((style) => ({
          key: style,
          count: results.filter((v) => v.bodyStyle === style).length,
        })),
        priceRanges: [
          { key: 'Under $20k', count: results.filter((v) => v.price < 20000).length },
          { key: '$20k-$30k', count: results.filter((v) => v.price >= 20000 && v.price < 30000).length },
          { key: '$30k-$40k', count: results.filter((v) => v.price >= 30000 && v.price < 40000).length },
          { key: '$40k-$50k', count: results.filter((v) => v.price >= 40000 && v.price < 50000).length },
          { key: 'Over $50k', count: results.filter((v) => v.price >= 50000).length },
        ],
      },
    },
  })
}
