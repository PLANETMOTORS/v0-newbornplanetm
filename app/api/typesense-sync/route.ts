// Typesense Sync Edge Function - Disabled
// Search is now handled directly via Supabase
// This endpoint is kept for backward compatibility

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Typesense sync disabled - using Supabase directly
  // Return success to prevent errors from any remaining webhooks
  try {
    const payload = await request.json()
    const { operation, vehicle_id } = payload
    
    return NextResponse.json({ 
      success: true, 
      message: 'Typesense sync disabled - using Supabase',
      operation: operation || 'noop',
      id: vehicle_id || null
    })
  } catch {
    return NextResponse.json({ 
      success: true, 
      message: 'Typesense sync disabled - using Supabase'
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'disabled',
    message: 'Typesense sync disabled - search handled via Supabase'
  })
}
