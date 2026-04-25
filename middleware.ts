import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that must never be accessible in production
const DEV_ONLY_ROUTES = ['/mockup', '/production-readiness']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block dev/internal routes in production
  if (process.env.NODE_ENV === 'production') {
    if (DEV_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
      return new NextResponse(null, { status: 404 })
    }
  }

  const { response } = await updateSession(request)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public assets (svg, png, jpg, jpeg, gif, webp, ico, woff, woff2)
     */
    String.raw`/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)`,
  ],
}

