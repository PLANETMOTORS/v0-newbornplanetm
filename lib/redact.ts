/**
 * PII redaction utilities for safe logging.
 *
 * Do NOT log raw user emails, phones, or account identifiers. Use these
 * helpers to produce a deterministic, non-reversible preview for logs and
 * telemetry so incidents remain debuggable without exposing PII.
 */

/**
 * Mask an email address for logging, preserving the domain and a short hint
 * of the local part: `jane.doe@example.com` → `j***e@example.com`.
 * Returns an empty-string sentinel when the input is missing/invalid.
 */
export function maskEmail(email: string | null | undefined): string {
  if (typeof email !== "string") return "<missing>"
  // Strip ASCII control characters (including \r \n \t and DEL) before any
  // processing to prevent log injection when the masked value is written
  // to console logs. Implemented without a control-class regex (eslint
  // no-control-regex) by scanning code points.
  let sanitized = ""
  for (let i = 0; i < email.length; i++) {
    const code = email.codePointAt(i) ?? 0
    if (code > 0x1f && code !== 0x7f) sanitized += email[i]
  }
  const trimmed = sanitized.trim()
  if (!trimmed) return "<missing>"
  const atIdx = trimmed.lastIndexOf("@")
  if (atIdx <= 0 || atIdx === trimmed.length - 1) return "<redacted>"
  const local = trimmed.slice(0, atIdx)
  const domain = trimmed.slice(atIdx + 1)
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local.at(-1)}@${domain}`
}

/**
 * Mask a phone number, preserving the last 4 digits:
 * `+14165551234` → `***1234`.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (typeof phone !== "string") return "<missing>"
  const digits = phone.replaceAll(/\D/g, "")
  if (digits.length < 4) return "<redacted>"
  return `***${digits.slice(-4)}`
}
