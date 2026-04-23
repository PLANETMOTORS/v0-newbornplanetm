// Stateless Supabase client for public, read-only queries.
// Unlike lib/supabase/server.ts, this does NOT call cookies(),
// so it won't opt the route out of static generation / ISR.
// Use this only for unauthenticated public data (e.g. vehicle listings).
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabasePooledUrl, getSupabaseUrl } from '@/lib/supabase/config'

let _client: ReturnType<typeof createSupabaseClient> | null = null

export function createStaticClient() {
  if (_client) return _client

  const supabaseUrl = getSupabasePooledUrl() || getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  _client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  return _client
}
