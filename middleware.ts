import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that must never be accessible in production
const DEV_ONLY_ROUTES = ['/mockup', '/production-readiness']

// Admin sub-paths that must remain accessible without authentication
// (login flow pages). Everything else under /admin/* requires auth.
const ADMIN_PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

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

  const { response, user } = await updateSession(request)

  // ── Admin route authentication gate ──────────────────────────────
  // Redirect unauthenticated visitors to the admin login page.
  // NOTE: This is an *authentication* check only (is the user signed in?).
  // The *authorization* check (is this user an admin with the right
  // permissions?) happens in the client layout via /api/v1/admin/me
  // because Edge middleware cannot perform Supabase service-role DB
  // lookups against the admin_users table.
  if (pathname.startsWith('/admin') && !isAdminPublicPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
     *
     * NOTE: Next.js statically analyses `config.matcher` and only accepts
     * plain string literals here — tagged templates like `String.raw\`...\``
     * make Next bail with "Invalid segment configuration export" during
     * page-data collection, so S7780 is suppressed for this single literal.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)', // NOSONAR S7780 — Next.js statically analyses config.matcher and only accepts plain string literals; String.raw breaks page-data collection.
  ],
}

