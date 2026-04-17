import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Admin emails — env var takes precedence, falls back to hardcoded list
const ADMIN_EMAILS: readonly string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim())
  : ['admin@planetmotors.ca', 'toni@planetmotors.ca']

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase auth session (also protects /protected routes)
  const { response, user } = await updateSession(request)

  // If updateSession already issued a redirect (e.g. /protected without auth), honour it
  if (response.status >= 300 && response.status < 400) {
    return response
  }

  // 2. Block internal/dev pages from public access (redirect non-admins to homepage)
  const INTERNAL_PAGES = ['/mockup', '/production-readiness', '/test-results', '/viewer']
  const isInternalPage = INTERNAL_PAGES.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`))

  if (isInternalPage) {
    const isAdmin =
      !!user &&
      (ADMIN_EMAILS.includes(user.email ?? '') || user.user_metadata?.is_admin === true)

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 3. Server-side admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    const isAdmin =
      ADMIN_EMAILS.includes(user.email ?? '') ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all routes EXCEPT:
     *  - _next/static, _next/image (Next.js internals)
     *  - favicon.ico, static assets (svg|png|jpg|jpeg|gif|webp|ico)
     *  - /api/webhooks/*  (Stripe — uses its own signature verification)
     *  - /api/sanity-webhook (Sanity — uses its own signature verification)
     *  - sitemap.xml, sitemap/*.xml, robots.txt (metadata routes — must not be intercepted)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/webhooks/|api/sanity-webhook|sitemap\\.xml|sitemap/|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
