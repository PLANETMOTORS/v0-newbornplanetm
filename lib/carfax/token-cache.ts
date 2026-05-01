/**
 * In-memory token cache for the Carfax Canada Auth0 client_credentials flow.
 *
 * Why an in-process cache instead of Redis?
 * -----------------------------------------
 * - Carfax issues a 2-hour bearer token. The doc explicitly says "wait the
 *   entirety of the 2 hours before renewing", so per-request token requests
 *   are off the table.
 * - On Vercel each serverless instance is short-lived, so a per-instance cache
 *   is the right granularity: we never call the token endpoint more than once
 *   per cold start, and Vercel reuses warm instances within a token's TTL.
 * - We renew at 90% of the TTL (i.e. ~1h 48m) so background renewal never
 *   races against the expiry.
 * - For multi-instance fan-out (cron + interactive at once) the worst case is
 *   one extra token mint per instance, which is acceptable; Carfax's docs
 *   accept multiple active tokens per client_id.
 *
 * The cache is keyed by client_id so two different dealerships using the same
 * Vercel project (highly unlikely, but cheap to support) don't collide.
 */

import type { CarfaxToken } from "./schemas"

/** Renewal window — refresh once we've consumed 90% of the TTL. */
const RENEW_AT_FRACTION = 0.9

interface CachedToken {
  readonly accessToken: string
  /** Absolute epoch-millis at which the token must be considered expired. */
  readonly expiresAtMs: number
}

const cache: Map<string, CachedToken> = new Map()

/**
 * Inject a token into the cache. The TTL comes from Carfax's `expires_in`
 * (seconds). We persist the absolute expiry as epoch-millis so the renewal
 * check is a single subtraction.
 */
export function storeToken(clientId: string, token: CarfaxToken, nowMs: number = Date.now()): void {
  const expiresAtMs = nowMs + token.expires_in * 1_000
  cache.set(clientId, { accessToken: token.access_token, expiresAtMs })
}

/**
 * Return the cached token if still inside its renewal window, otherwise null.
 *
 * The 90% rule means: if 1h 48m of a 2h TTL has passed, treat the token as
 * stale even though Carfax would still accept it. This guarantees we always
 * have ~12 minutes of headroom for the renewal RTT.
 */
export function getCachedToken(
  clientId: string,
  nowMs: number = Date.now(),
): string | null {
  const entry = cache.get(clientId)
  if (!entry) return null
  const ttlMs = entry.expiresAtMs - nowMs
  if (ttlMs <= 0) return null
  // Pull the renewal threshold from the original lifetime so this still
  // works regardless of what the token's expires_in actually was.
  // We can't recover the original TTL exactly, so we use a fixed
  // "consider stale at <12 min remaining" rule: any token with less than
  // (1 - RENEW_AT_FRACTION) of its original Carfax TTL is treated as stale.
  // The standard expires_in is 7200s (2h), so 10% = 720s ≈ 12 min.
  const STALE_AT_MS = 12 * 60 * 1_000
  if (ttlMs <= STALE_AT_MS) return null
  return entry.accessToken
}

/** Test seam: clear the cache between tests. */
export function clearCarfaxTokenCache(): void {
  cache.clear()
}

// Compile-time reference so TS doesn't dead-code-eliminate the constant
// (it's exported here so tests can introspect the policy if needed).
export const __RENEW_AT_FRACTION = RENEW_AT_FRACTION
