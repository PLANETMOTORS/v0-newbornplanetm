/**
 * ReDoS-free email format check.
 *
 * Performs a structural, single-pass validation without backtracking regex,
 * eliminating Sonar S5852 / S2631 hotspots in caller files. Not a full
 * RFC 5321/5322 validator — used at trust boundaries to reject obviously
 * malformed input before downstream Zod / DB constraints take over.
 *
 * Rules:
 *  - 1 ≤ length ≤ 254
 *  - exactly one "@"
 *  - non-empty local part and domain
 *  - domain contains at least one "." that is neither the first nor last char
 *  - no whitespace anywhere
 */
export function isEmailLike(value: string): boolean {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  const len = trimmed.length
  if (len === 0 || len > 254) return false
  const at = trimmed.indexOf("@")
  if (at <= 0) return false
  if (at !== trimmed.lastIndexOf("@")) return false
  const domain = trimmed.slice(at + 1)
  if (domain.length === 0) return false
  const dot = domain.lastIndexOf(".")
  if (dot <= 0 || dot === domain.length - 1) return false
  // /\s/ is a single-character class with no quantifier — not ReDoS-prone.
  if (/\s/.test(trimmed)) return false
  return true
}
