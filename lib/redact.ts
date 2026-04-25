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
  const trimmed = email.trim()
  if (!trimmed) return "<missing>"
  const atIdx = trimmed.lastIndexOf("@")
  if (atIdx <= 0 || atIdx === trimmed.length - 1) return "<redacted>"
  const local = trimmed.slice(0, atIdx)
  const domain = trimmed.slice(atIdx + 1)
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

/**
 * Mask a phone number, preserving the last 4 digits:
 * `+14165551234` → `***1234`.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (typeof phone !== "string") return "<missing>"
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) return "<redacted>"
  return `***${digits.slice(-4)}`
}
