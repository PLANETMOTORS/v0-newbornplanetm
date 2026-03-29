// Typesense Sync Edge Function
// Receives webhooks from Supabase trigger and syncs to Typesense

import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'

const typesenseClient = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'typesense.planetmotors.ca',
    port: 443,
    protocol: 'https'
  }],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 2
})

const COLLECTION_NAME = 'vehicles'

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  exterior_color: string
  interior_color: string
  fuel_type: string
  transmission: string
  drivetrain: string
  body_type: string
  engine: string
  features: string[]
  images: string[]
  status: string
  condition: string
  certified: boolean
  ev_range?: number
  battery_health?: number
  location?: { lat: number; lng: number }
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.TYPESENSE_SYNC_SECRET}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const { operation, vehicle, vehicle_id } = payload

    if (operation === 'delete') {
      // Delete from Typesense
      await typesenseClient
        .collections(COLLECTION_NAME)
        .documents(vehicle_id)
        .delete()
      
      return NextResponse.json({ success: true, operation: 'deleted', id: vehicle_id })
    }

    // Transform vehicle for Typesense
    const typesenseDoc = transformVehicle(vehicle)

    // Upsert to Typesense
    await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .upsert(typesenseDoc)

    return NextResponse.json({ 
      success: true, 
      operation: operation === 'create' ? 'created' : 'updated',
      id: vehicle.id 
    })

  } catch (error) {
    console.error('Typesense sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function transformVehicle(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    vin: vehicle.vin,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    exterior_color: vehicle.exterior_color,
    interior_color: vehicle.interior_color,
    fuel_type: vehicle.fuel_type,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.body_type,
    engine: vehicle.engine,
    features: vehicle.features || [],
    images: vehicle.images || [],
    status: vehicle.status,
    condition: vehicle.condition,
    certified: vehicle.certified,
    ev_range: vehicle.ev_range || 0,
    battery_health: vehicle.battery_health || 100,
    // Typesense geo search format
    location: vehicle.location 
      ? [vehicle.location.lat, vehicle.location.lng] 
      : [43.8971, -79.4352], // Default: Richmond Hill
    // Searchable combined field
    search_text: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.exterior_color} ${vehicle.body_type}`,
    // Timestamps as unix for sorting
    created_at_unix: new Date(vehicle.created_at).getTime(),
    updated_at_unix: new Date(vehicle.updated_at).getTime(),
  }
}

// Health check
export async function GET() {
  try {
    const health = await typesenseClient.health.retrieve()
    return NextResponse.json({ status: 'healthy', typesense: health })
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 })
  }
}
