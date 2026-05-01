/**
 * In-memory token cache for the Carfax Canada Auth0 client_credentials flow.
 *
 * Carfax issues a 2-hour bearer token and explicitly says "wait the entirety
 * of the 2 hours before renewing", so per-request token requests are off the
 * table. Per-instance caching is the right granularity on Vercel: each warm
 * lambda calls /oauth/token at most once per token TTL.
 *
 * We mark a token stale once it has < 12 minutes remaining, giving us
 * ~10% headroom on a 2h TTL for the renewal RTT.
 */

import type { CarfaxToken } from "./schemas"

const STALE_AT_MS = 12 * 60 * 1_000

interface CachedToken {
  readonly accessToken: string
  /** Absolute epoch-millis at which the token must be considered expired. */
  readonly expiresAtMs: number
}

const cache: Map<string, CachedToken> = new Map()

export function storeToken(
  clientId: string,
  token: CarfaxToken,
  nowMs: number = Date.now(),
): void {
  cache.set(clientId, {
    accessToken: token.access_token,
    expiresAtMs: nowMs + token.expires_in * 1_000,
  })
}

export function getCachedToken(
  clientId: string,
  nowMs: number = Date.now(),
): string | null {
  const entry = cache.get(clientId)
  if (!entry) return null
  const remainingMs = entry.expiresAtMs - nowMs
  if (remainingMs <= STALE_AT_MS) return null
  return entry.accessToken
}

/** Test seam: clear the cache between tests. */
export function clearCarfaxTokenCache(): void {
  cache.clear()
}

/** Exported policy values for observability / tests. */
export const TOKEN_POLICY = {
  staleAtMs: STALE_AT_MS,
} as const
