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

const SENSITIVE_KEY_RE =
  /^(email|phone|phone_number|first_name|last_name|firstName|lastName|name|dob|date_of_birth|dateOfBirth|sin|address|street|streetAddress|street_address|postal_code|postalCode|password|passwordHash|password_hash|secret|api_key|apikey|apiKey|access_token|accessToken|refresh_token|refreshToken|stripe_secret|stripe_webhook_secret|service_role_key|serviceRoleKey|authorization|cookie|set-cookie)$/i

const VALUE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Stripe secrets / pubkeys (keep pk_test/live since they're public).
  { name: "stripe-secret", re: /\bsk_(test|live)_[A-Za-z0-9]{16,}\b/g },
  { name: "stripe-restricted", re: /\brk_(test|live)_[A-Za-z0-9]{16,}\b/g },
  { name: "stripe-webhook", re: /\bwhsec_[A-Za-z0-9]{16,}\b/g },
  // Resend API keys
  { name: "resend", re: /\bre_[A-Za-z0-9_-]{16,}\b/g },
  // Supabase JWT (anon + service role both look like JWTs)
  { name: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scrubValue(value: any, depth = 0): any {
  if (depth > 8) return value // hard cap to avoid pathological recursion
  if (value === null || value === undefined) return value

  if (typeof value === "string") return scrubString(value)
  if (typeof value === "number" || typeof value === "boolean") return value

  if (Array.isArray(value)) {
    return value.map((v) => scrubValue(v, depth + 1))
  }

  if (typeof value === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_RE.test(k)) {
        out[k] = REDACTED
      } else {
        out[k] = scrubValue(v, depth + 1)
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
