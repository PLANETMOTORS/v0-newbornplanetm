// Typesense Sync Webhook — receives insert/update/delete from Supabase DB trigger
import { NextRequest, NextResponse } from 'next/server'
import { upsertVehicle, deleteVehicle, type VehicleDocument } from '@/lib/typesense/indexer'
import { isTypesenseConfigured } from '@/lib/typesense/client'
import { verifyCronSecret } from '@/lib/security/cron-auth'

export async function POST(request: NextRequest) {
  // This webhook mutates the Typesense search index, so it MUST be
  // authenticated in ALL environments (including preview deployments).
  const syncSecret = process.env.TYPESENSE_SYNC_SECRET || process.env.CRON_SECRET
  if (!syncSecret) {
    return NextResponse.json(
      { error: 'Server misconfigured: webhook secret missing' },
      { status: 500 },
    )
  }
  const auth = verifyCronSecret(request, { secret: syncSecret })
  if (!auth.ok) return auth.response

  if (!isTypesenseConfigured()) {
    return NextResponse.json({ success: true, message: 'Typesense not configured — skipping' })
  }

  try {
    const payload = await request.json()
    const { operation, vehicle_id, vehicle } = payload

    if (operation === 'delete' && vehicle_id) {
      await deleteVehicle(String(vehicle_id))
      return NextResponse.json({ success: true, operation: 'delete', id: vehicle_id })
    }

    if ((operation === 'insert' || operation === 'update') && vehicle) {
      const doc: VehicleDocument = {
        id: String(vehicle.id),
        stock_number: String(vehicle.stock_number || ''),
        year: Number(vehicle.year || 0),
        make: String(vehicle.make || ''),
        model: String(vehicle.model || ''),
        trim: vehicle.trim || undefined,
        body_style: vehicle.body_style || undefined,
        exterior_color: vehicle.exterior_color || undefined,
        price: Number(vehicle.price || 0),
        mileage: Number(vehicle.mileage || 0),
        drivetrain: vehicle.drivetrain || undefined,
        fuel_type: vehicle.fuel_type || undefined,
        transmission: vehicle.transmission || undefined,
        engine: vehicle.engine || undefined,
        is_ev: Boolean(vehicle.is_ev),
        is_certified: Boolean(vehicle.is_certified),
        status: String(vehicle.status || 'available'),
        primary_image_url: vehicle.primary_image_url || undefined,
        description: vehicle.description || undefined,
        vin: vehicle.vin || undefined,
        location: vehicle.location || undefined,
        created_at: vehicle.created_at
          ? Math.floor(new Date(vehicle.created_at).getTime() / 1000)
          : undefined,
      }
      await upsertVehicle(doc)
      return NextResponse.json({ success: true, operation, id: doc.id })
    }

    return NextResponse.json({ success: true, operation: operation || 'noop' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Typesense Sync] Error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: isTypesenseConfigured() ? 'active' : 'not_configured',
    message: isTypesenseConfigured()
      ? 'Typesense sync active — POST vehicle changes here'
      : 'Typesense not configured — set TYPESENSE_API_KEY + TYPESENSE_HOST',
  })
}
