import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass-through middleware - no auth checks at middleware level
  // Auth protection is handled in individual pages/components
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run middleware on specific routes if needed
    // For now, this is a pass-through to prevent initialization errors
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
