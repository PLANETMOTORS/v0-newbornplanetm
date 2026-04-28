/**
 * Authentication rate-limiting primitives.
 *
 * Wraps lib/redis.ts:rateLimit() with auth-specific defaults and a shared
 * sha256 scope hasher so that:
 *   - login attempts are bucketed by  (clientIp + emailHash)
 *   - refresh attempts are bucketed by (clientIp + refreshTokenFingerprint)
 *
 * Defaults are tuned to:
 *   - login   : 5 attempts / 15 minutes  (OWASP ASVS V2.2.1 floor)
 *   - refresh : 60 attempts / 60 minutes (~1/min — generous for legitimate
 *                                          clients, brutal for credential
 *                                          stuffing)
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
  /** Max attempts inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

const LOGIN: AuthRateLimitConfig = { bucket: "login", limit: 5, windowSeconds: 15 * 60 }
const REFRESH: AuthRateLimitConfig = { bucket: "refresh", limit: 60, windowSeconds: 60 * 60 }

export const AUTH_RATE_LIMITS = { LOGIN, REFRESH } as const

/** Return a stable, non-reversible scope token for `value`. */
function fingerprint(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24)
}

/**
 * Apply an auth rate-limit and return whether the caller may proceed.
 *
 * @param request – the incoming Next.js Request
 * @param principal – the per-user identifier you want to bucket on
 *                    (e.g. email for login, refresh-token for refresh).
 *                    NEVER stored or logged in clear text — always hashed.
 * @param cfg – rate-limit configuration; pick from AUTH_RATE_LIMITS
 * @returns `{ allowed, remaining, retryAfterSeconds }`
 */
export async function checkAuthRateLimit(
  request: Request,
  principal: string,
  cfg: AuthRateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const ip = getClientIp(request)
  const principalHash = fingerprint(principal)
  const key = `auth:${cfg.bucket}:${ip}:${principalHash}`
  const result = await rateLimit(key, cfg.limit, cfg.windowSeconds)
  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterSeconds: result.success ? 0 : cfg.windowSeconds,
  }
}
