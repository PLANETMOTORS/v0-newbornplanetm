import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'

type CookieMutation = {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

/**
 * Apply two NON-DESTRUCTIVE hardening defaults to a cookie options object
 * coming out of @supabase/ssr:
 *
 *   - secure   defaults to true in production, never weakening Supabase's
 *              explicit choice.
 *   - sameSite defaults to 'lax' when Supabase didn't set one, still
 *              respecting Supabase's own value (e.g. 'strict' on the
 *              PKCE auth-flow cookie).
 *
 * We DELIBERATELY do not touch `httpOnly`. @supabase/ssr leaves it
 * undefined on session cookies so `createBrowserClient` can read the
 * access/refresh tokens via `document.cookie`. Forcing httpOnly=true
 * here would silently break every page that uses the browser SDK
 * (auth, account, admin, finance, favorites, ...).
 *
 * Exported so it can be unit-tested without standing up a NextResponse
 * + a full Supabase server client.
 */
export function applySupabaseCookieDefaults(
  options: NonNullable<CookieMutation["options"]> | undefined,
  isProduction: boolean = process.env.NODE_ENV === "production"
): NonNullable<CookieMutation["options"]> {
  return {
    ...options,
    secure: options?.secure ?? isProduction,
    sameSite: options?.sameSite ?? "lax",
  }
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
          supabaseResponse.cookies.set(
            name,
            value,
            applySupabaseCookieDefaults(options)
          )
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
