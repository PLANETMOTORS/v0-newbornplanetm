// Stub file - Supabase integration not yet connected
// This file exists to prevent build errors from stale cache
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Pass through - auth will be enabled when Supabase is connected
  return NextResponse.next()
}
