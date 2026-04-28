/**
 * Authentication rate-limiting primitives.
 *
 * Wraps lib/redis.ts:rateLimit() with auth-specific defaults and TWO
 * orthogonal scopes per request:
 *
 *   1. principal scope:  (clientIp + sha256(principal)) — limits brute-force
 *      against a *specific* email or refresh-token from a single IP.
 *   2. ip scope:         (clientIp)                      — limits the TOTAL
 *      auth traffic from a single IP, so an attacker cannot bypass the
 *      principal bucket by rotating across many emails or refresh-tokens
 *      from the same source.
 *
 * A request is allowed only when BOTH buckets allow it. The IP-only ceiling
 * is multiplied (default 5x) to remain permissive for shared-egress NAT
 * (small offices, public Wi-Fi) while still bounding per-IP burst.
 *
 * Defaults are tuned to:
 *   - login   : 5 attempts / 15 minutes  (OWASP ASVS V2.2.1 floor)
 *               + IP ceiling of 25/15 minutes
 *   - refresh : 60 attempts / 60 minutes (~1/min)
 *               + IP ceiling of 300/60 minutes
 *
 * Fail-open semantics: if Redis is unreachable, the underlying rateLimit()
 * helper returns success=true. We keep that behaviour here so a Redis
 * outage does not deny legitimate logins. The tradeoff is documented in
 * SECURITY.md and accepted at the team level.
 */

import { createHash } from "node:crypto"
import { rateLimit } from "@/lib/redis"
import { getClientIp } from "@/lib/security/client-ip"

export interface AuthRateLimitConfig {
  /** Logical bucket: 'login', 'refresh', etc. */
  bucket: "login" | "refresh"
  /** Max attempts per (IP + principal) inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
  /**
   * Multiplier applied to `limit` to derive the IP-only ceiling. Defaults
   * to 5 — a single IP may legitimately serve up to 5 concurrent users
   * (small office NAT, mobile carrier CGNAT) but anything beyond that on
   * an auth endpoint is almost certainly automated.
   */
  ipCeilingMultiplier?: number
}

const LOGIN: AuthRateLimitConfig = {
  bucket: "login",
  limit: 5,
  windowSeconds: 15 * 60,
  ipCeilingMultiplier: 5,
}
const REFRESH: AuthRateLimitConfig = {
  bucket: "refresh",
  limit: 60,
  windowSeconds: 60 * 60,
  ipCeilingMultiplier: 5,
}

export const AUTH_RATE_LIMITS = { LOGIN, REFRESH } as const

/** Return a stable, non-reversible scope token for `value`. */
function fingerprint(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24)
}

/**
 * Apply both auth rate-limits and return whether the caller may proceed.
 *
 * Two buckets are checked in parallel and the request is allowed only when
 * BOTH return success:
 *
 *   - principal scope: `auth:<bucket>:<ip>:<sha256(principal)>`
 *   - ip scope:        `auth:<bucket>:ip:<ip>`
 *
 * The IP-only scope catches bypass strategies that rotate the principal
 * (e.g. credential-stuffing across thousands of emails from one host).
 *
 * @param request – the incoming Next.js Request
 * @param principal – the per-user identifier you want to bucket on
 *                    (e.g. email for login, refresh-token for refresh).
 *                    NEVER stored or logged in clear text — always hashed.
 * @param cfg – rate-limit configuration; pick from AUTH_RATE_LIMITS
 */
export async function checkAuthRateLimit(
  request: Request,
  principal: string,
  cfg: AuthRateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const ip = getClientIp(request)
  const principalHash = fingerprint(principal)
  const principalKey = `auth:${cfg.bucket}:${ip}:${principalHash}`
  const ipKey = `auth:${cfg.bucket}:ip:${ip}`

  const ipMultiplier = cfg.ipCeilingMultiplier ?? 5
  const ipLimit = cfg.limit * ipMultiplier

  // Run both checks; we want each one to atomically increment its own
  // counter exactly once per request, regardless of the other's outcome.
  const [principalResult, ipResult] = await Promise.all([
    rateLimit(principalKey, cfg.limit, cfg.windowSeconds),
    rateLimit(ipKey, ipLimit, cfg.windowSeconds),
  ])

  const allowed = principalResult.success && ipResult.success
  return {
    allowed,
    remaining: Math.max(
      0,
      Math.min(principalResult.remaining, ipResult.remaining)
    ),
    retryAfterSeconds: allowed ? 0 : cfg.windowSeconds,
  }
}
