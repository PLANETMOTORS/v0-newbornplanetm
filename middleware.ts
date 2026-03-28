import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple pass-through middleware - Supabase auth will be handled in components
  // This prevents build-time errors while Supabase connection is being established
  
  // Only protect /protected routes if Supabase is configured
  if (
    request.nextUrl.pathname.startsWith('/protected') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const { updateSession } = await import('@/lib/supabase/middleware')
      return await updateSession(request)
    } catch (error) {
      // If Supabase fails, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
