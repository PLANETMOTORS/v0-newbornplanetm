/**
 * Type-narrowed primitive coercion helpers.
 *
 * Centralised so we can ban the unsafe `String(unknownValue || default)` /
 * `Number(unknownValue || default)` patterns that Sonar S6551 flags. If the
 * input is anything other than a primitive that `String()` / `Number()` can
 * safely convert, we fall back to the supplied default rather than letting
 * an object reference render as `"[object Object]"`.
 */

/** Returns `value` if it is a string, otherwise `fallback` (default `""`). */
export function asStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

/** Returns `value` if it is a string, otherwise `undefined`. */
export function asOptStr(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

/** Returns `value` if it is a finite number, otherwise `fallback` (default `0`). */
export function asNum(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

/**
 * Like `asStr` but also accepts numbers (coerced via `String(n)`). Anything
 * else falls back. Useful when the upstream value can legitimately arrive as
 * either string or number (e.g. form-encoded numeric fields).
 */
export function asScalarString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return fallback
}

/**
 * Reads a primitive field from an unknown record, gating the read on
 * `typeof value === "string"`. Returns `fallback` for any other shape
 * (including missing keys, nested objects, arrays, etc.).
 */
export function pickString(
  record: Record<string, unknown> | null | undefined,
  key: string,
  fallback = "",
): string {
  if (!record) return fallback
  const v = record[key]
  return typeof v === "string" ? v : fallback
}

/**
 * Reads a primitive numeric field from an unknown record. Returns `fallback`
 * if the value is missing or not a finite number.
 */
export function pickNumber(
  record: Record<string, unknown> | null | undefined,
  key: string,
  fallback = 0,
): number {
  if (!record) return fallback
  const v = record[key]
  return typeof v === "number" && Number.isFinite(v) ? v : fallback
}
