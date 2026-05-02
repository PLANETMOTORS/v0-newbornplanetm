/**
 * lib/supabase/read-replica.ts
 *
 * Read-replica-aware Supabase client for public, read-only queries.
 *
 * When `SUPABASE_READ_REPLICA_URL` and `SUPABASE_READ_REPLICA_ANON_KEY` are
 * set, this returns a client pointed at the replica — offloading inventory
 * search, VDP fetches, and any other read traffic from the primary database.
 *
 * When the replica is not configured (e.g. local dev, preview deploys), it
 * falls back to the standard static client so callers do not need to branch.
 *
 * Contract:
 *   - Read-only. Never use for inserts/updates — replica replication is
 *     asynchronous and you will lose writes.
 *   - Stateless. Does NOT call cookies(); safe to use inside ISR and static
 *     generation.
 *   - Memoised per-process to avoid repeated client construction.
 *
 * Tracked env vars (production only):
 *   SUPABASE_READ_REPLICA_URL       — e.g. https://<replica-id>.supabase.co
 *   SUPABASE_READ_REPLICA_ANON_KEY  — anon key issued for the replica
 */

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { createStaticClient } from "@/lib/supabase/static"

let _replicaClient: SupabaseClient | null = null

export function getReadReplicaUrl(): string | undefined {
  return process.env.SUPABASE_READ_REPLICA_URL || undefined
}

export function getReadReplicaAnonKey(): string | undefined {
  return process.env.SUPABASE_READ_REPLICA_ANON_KEY || undefined
}

/**
 * Returns true when both replica env vars are present.
 *
 * Exported for diagnostics (`/api/health` extension, deploy checks). Do NOT
 * use this to decide between two code paths in hot read endpoints — call
 * `createReadClient()` instead, which already encapsulates the fallback.
 */
export function isReadReplicaConfigured(): boolean {
  return !!getReadReplicaUrl() && !!getReadReplicaAnonKey()
}

/**
 * Internal: build a fresh replica client. Exported for tests only via the
 * memoised wrapper below.
 */
function buildReplicaClient(url: string, key: string): SupabaseClient {
  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Returns a Supabase client for read traffic.
 *
 * - If a read replica is configured, returns a memoised client pointed at it.
 * - Otherwise, returns the existing primary static client.
 *
 * The returned client is the same shape as `createStaticClient()`, so callers
 * can swap this in without changing any query code.
 */
export function createReadClient(): SupabaseClient {
  const url = getReadReplicaUrl()
  const key = getReadReplicaAnonKey()

  if (!url || !key) {
    return createStaticClient() as SupabaseClient
  }

  _replicaClient ??= buildReplicaClient(url, key)
  return _replicaClient
}

/**
 * Test-only: clear the memoised replica client. Production code must never
 * call this. Exported under a clearly-marked name so it cannot be confused
 * with a public API.
 */
export function __resetReadReplicaClientForTests(): void {
  _replicaClient = null
}
