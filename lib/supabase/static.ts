// Stateless Supabase client for public, read-only queries.
// Unlike lib/supabase/server.ts, this does NOT call cookies(),
// so it won't opt the route out of static generation / ISR.
// Use this only for unauthenticated public data (e.g. vehicle listings).
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabasePooledUrl, getSupabaseUrl } from '@/lib/supabase/config'

let _client: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Returns a stateless Supabase client for public reads, or null if credentials
 * are not configured (e.g. CI builds, local dev without .env.local).
 * Callers must guard against null before issuing queries.
 */
export function createStaticClient(): ReturnType<typeof createSupabaseClient> | null {
  if (_client) return _client

  const supabaseUrl = getSupabasePooledUrl() || getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    // Credentials not configured — return null instead of throwing so that
    // SSG pages degrade gracefully (show empty/fallback state) rather than
    // failing the entire build.
    console.warn(
      '[Supabase] createStaticClient: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set. ' +
      'Returning null — callers will use fallback data.'
    )
    return null
  }

  _client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  return _client
}
