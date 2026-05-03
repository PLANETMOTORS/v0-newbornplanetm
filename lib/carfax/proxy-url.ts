/**
 * Converts a CARFAX CDN badge URL into our server-side proxy URL.
 *
 * Before:  https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree_OneOwner.svg
 * After:   /api/v1/carfax/badge?url=https%3A%2F%2Fcdn.carfax.ca%2Fbadging%2Fv3%2Fen%2FLogo_AccidentFree_OneOwner.svg
 *
 * This ensures the browser loads the SVG from our own domain,
 * completely bypassing CSP / CORS / privacy-blocker issues.
 *
 * Non-carfax URLs are returned as-is (defensive).
 */
export function proxyBadgeUrl(cdnUrl: string): string {
  if (!cdnUrl || !cdnUrl.includes("cdn.carfax.ca")) return cdnUrl
  return `/api/v1/carfax/badge?url=${encodeURIComponent(cdnUrl)}`
}
