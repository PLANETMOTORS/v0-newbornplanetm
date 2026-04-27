'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'

/**
 * Returns a Supabase browser client.
 *
 * In production NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are
 * always set at Vercel build time, so the real client is always returned.
 *
 * In CI / SSR prerender environments where those env-vars are absent, Turbopack
 * evaluates this module at chunk-load time.  Throwing here kills the prerender
 * worker for every page that transitively imports this module.  Instead, we
 * return a client built from inert placeholder credentials; no actual Supabase
 * request is ever made during SSR prerender because all data-fetching in
 * 'use client' components happens inside useEffect / event handlers — never
 * during the synchronous render pass.  Any attempt to use the placeholder
 * client in the browser (which should never happen in production) will produce
 * a clear 4xx / network error at the individual query site.
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // Real browser runtime — credentials are required.
      throw new Error(
        'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
    }
    // SSR / build-time prerender without credentials (e.g. CI).
    // Return a placeholder client so module initialisation does not throw and
    // kill the prerender worker.  No Supabase queries are issued server-side
    // through this ('use client') module.
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key-not-for-production'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
