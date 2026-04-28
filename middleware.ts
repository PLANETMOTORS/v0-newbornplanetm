import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that must never be accessible in production
const DEV_ONLY_ROUTES = ['/mockup', '/production-readiness']

// NOTE: All security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
// Referrer-Policy, Permissions-Policy, X-XSS-Protection) are defined as the
// SINGLE source of truth in `next.config.mjs:async headers()`. Do NOT duplicate
// them here — running two header pipelines would either intersect into a
// browser-tightest CSP (breaking unrelated origins) or have one silently
// overwrite the other (security change not taking effect).
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
    // NOTE: Next.js statically analyses `config.matcher` and requires a plain
    // string literal here — tagged templates like `String.raw\`...\`` make Next
    // bail out with "Invalid segment configuration export" during page-data
    // collection, so we keep the escaped form even though Sonar S7780 would
    // prefer String.raw. (Suppression: lint-disable-next-line)
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}

