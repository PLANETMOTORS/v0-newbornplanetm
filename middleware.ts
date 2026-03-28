// Planet Motors - OMVIC Licensed Dealer #4048307
// Middleware v2.0 - Clean pass-through without external dependencies
import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass-through middleware - no Supabase imports
  // Session handling will be added after integration setup
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
