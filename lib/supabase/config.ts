export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || undefined
}

/**
 * Returns the Supabase URL with `?pgbouncer=true` appended for server-side
 * connection pooling. This routes connections through PgBouncer in transaction
 * mode, which dramatically reduces the number of direct Postgres connections
 * required under high concurrency (e.g., 10K+ vehicle inventory scale).
 *
 * Use this for server-side clients only (SSR, API routes, server actions).
 * The browser client should continue using the standard URL.
 */
export function getSupabasePooledUrl(): string | undefined {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!baseUrl) return undefined

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('pgbouncer', 'true')
    return url.toString()
  } catch {
    return undefined
  }
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}
