/**
 * PII / secret redaction for Sentry events.
 *
 * Wired up via Sentry.init({ beforeSend, beforeBreadcrumb }) in
 * sentry.{client,server,edge}.config.ts.
 *
 * Goal: any error or breadcrumb that lands in Sentry must NOT contain:
 *   - customer email / phone / first / last name / DOB / address / SIN
 *   - Stripe secret keys / webhook secrets
 *   - Supabase service-role key / anon key (anon is technically public,
 *     but redacting is a clean default)
 *   - JWT bearer tokens
 *   - credit-card-shaped digits
 *   - SIN-shaped digits
 *
 * Strategy is conservative: we walk the event tree and replace matched
 * values with the literal string "[REDACTED]". Schema is preserved so
 * downstream alerts / triage still work.
 *
 * NEVER throw from this module — Sentry will swallow events silently if
 * a beforeSend filter explodes. All paths must return SOME version of
 * the input.
 */

const REDACTED = "[REDACTED]"

// S5843 — keep the per-category regexes small and union them into a single
// case-insensitive lookup via a Set so the cognitive complexity of the
// overall match is well under the 20-token threshold.
const SENSITIVE_KEYS = new Set<string>([
  // PII
  "email", "phone", "phone_number",
  "first_name", "last_name", "firstName", "lastName", "name",
  "dob", "date_of_birth", "dateOfBirth", "sin",
  "address", "street", "streetAddress", "street_address",
  "postal_code", "postalCode",
  // Credentials
  "password", "passwordHash", "password_hash", "secret",
  "api_key", "apikey", "apiKey",
  "access_token", "accessToken", "refresh_token", "refreshToken",
  "stripe_secret", "stripe_webhook_secret",
  "service_role_key", "serviceRoleKey",
  "authorization", "cookie", "set-cookie",
])

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase())
}

const VALUE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Stripe secrets / pubkeys (keep pk_test/live since they're public).
  { name: "stripe-secret", re: /\bsk_(test|live)_[A-Za-z0-9]{16,}\b/g },
  { name: "stripe-restricted", re: /\brk_(test|live)_[A-Za-z0-9]{16,}\b/g },
  { name: "stripe-webhook", re: /\bwhsec_[A-Za-z0-9]{16,}\b/g },
  // Resend API keys
  { name: "resend", re: /\bre_[A-Za-z0-9_-]{16,}\b/g },
  // Supabase JWT (anon + service role both look like JWTs).
  // Quantifiers are upper-bounded so the regex is provably linear and
  // cannot drift into backtracking-sensitive territory (Sonar S5852).
  // Bounds chosen to fit the largest realistic JWT we see in practice
  // (RS256 with rich claims): header ≤ 512, payload ≤ 8192, signature ≤ 1024.
  {
    name: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,512}\.[A-Za-z0-9_-]{10,8192}\.[A-Za-z0-9_-]{10,1024}\b/g,
  },
  // Bearer tokens in Authorization headers
  { name: "bearer", re: /\bBearer\s+[A-Za-z0-9._\-+/=]{20,}/g },
  // Credit-card-shaped digit runs (13–19 digits, optional spaces/dashes)
  {
    name: "card",
    re: /\b(?:\d[ -]?){13,19}\b/g,
  },
  // SIN-shaped (Canadian Social Insurance Number)
  { name: "sin", re: /\b\d{3}[ -]?\d{3}[ -]?\d{3}\b/g },
  // Email addresses appearing in free text (best-effort)
  {
    name: "email-in-text",
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  },
]

function scrubString(input: string): string {
  let out = input
  for (const p of VALUE_PATTERNS) {
    out = out.replace(p.re, REDACTED)
  }
  return out
}

const CYCLE_MARKER = "[REDACTED:cycle]"
const DEPTH_MARKER = "[REDACTED:depth]"
const MAX_DEPTH = 8

/* eslint-disable @typescript-eslint/no-explicit-any */
function scrubValue(
  value: any,
  depth = 0,
  // WeakSet tracks objects already entered on the *current* descent path so
  // we never re-emit a circular reference back to Sentry's serializer
  // (which would either crash or drop the event silently). Returning a
  // string marker preserves event shape while breaking the cycle.
  seen: WeakSet<object> = new WeakSet()
): any {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  // Hard depth cap: return a STRING marker rather than the original object
  // so any cycle hidden below this depth cannot leak back into the event.
  if (depth > MAX_DEPTH) return DEPTH_MARKER
  if (value === null || value === undefined) return value

  if (typeof value === "string") return scrubString(value)
  if (typeof value === "number" || typeof value === "boolean") return value

  if (typeof value === "object") {
    if (seen.has(value)) return CYCLE_MARKER
    seen.add(value)

    if (Array.isArray(value)) {
      return value.map((v) => scrubValue(v, depth + 1, seen))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (isSensitiveKey(k)) {
        out[k] = REDACTED
      } else {
        out[k] = scrubValue(v, depth + 1, seen)
      }
    }
    return out
  }

  return value
}

/**
 * Sentry `beforeSend` filter — apply to every error event before upload.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function redactSentryEvent<T extends Record<string, any>>(event: T): T {
  try {
    return scrubValue(event) as T
  } catch {
    return event
  }
}

/**
 * Sentry `beforeBreadcrumb` filter — apply to every breadcrumb crumb.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function redactSentryBreadcrumb<T extends Record<string, any>>(crumb: T): T {
  try {
    return scrubValue(crumb) as T
  } catch {
    return crumb
  }
}

// Exported for unit tests
export const __testing = { scrubString, scrubValue, REDACTED }
