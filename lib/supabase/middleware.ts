import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'

type CookieMutation = {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response: NextResponse.next({ request }), user: null }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          // Harden every cookie Supabase writes back to the browser:
          //   secure  – never send over plain HTTP in production
          //   sameSite – defends against CSRF on state-changing endpoints
          //   httpOnly – not readable from client JS, defangs XSS theft
          //   path     – scope to '/'; explicit beats Supabase defaults
          supabaseResponse.cookies.set(name, value, {
            ...options,
            secure: options?.secure ?? process.env.NODE_ENV === "production",
            sameSite: options?.sameSite ?? "lax",
            httpOnly: options?.httpOnly ?? true,
            path: options?.path ?? "/",
          })
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/protected') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return { response: NextResponse.redirect(url), user: null }
  }

  return { response: supabaseResponse, user }
}
