/**
 * Best-effort client-IP extraction for Next.js Route Handlers.
 *
 * Order of preference:
 *   1. CF-Connecting-IP   — set by Cloudflare in front of Vercel
 *   2. X-Forwarded-For    — first IP in the comma-separated list (Vercel sets this)
 *   3. X-Real-IP          — common reverse-proxy header
 *   4. "unknown"          — explicit sentinel so a missing IP never collides
 *                            with a legitimate client IP in a rate-limit key
 *
 * NEVER trust this for authorization decisions — only use it as one component
 * of a rate-limit scope (e.g. `${ip}:${emailHash}`).
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")
  if (cf) return cf.trim().toLowerCase()

  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first.toLowerCase()
  }

  const xri = request.headers.get("x-real-ip")
  if (xri) return xri.trim().toLowerCase()

  return "unknown"
}
