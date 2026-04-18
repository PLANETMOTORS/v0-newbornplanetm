/**
 * CSRF origin validation utility.
 *
 * Compares the request's Origin (or Referer) header against a list of
 * allowed origins to prevent cross-site request forgery on public POST
 * endpoints.
 */

function getAllowedOrigins(): string[] {
  const origins: string[] = []

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl) {
    // Normalise: strip trailing slash
    origins.push(baseUrl.replace(/\/+$/, ""))
  }

  // Vercel deployment URL (auto-set by Vercel)
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`
    origins.push(normalized.replace(/\/+$/, ""))
  }

  // Custom domain(s) — allow ev.planetmotors.ca and planetmotors.ca
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN
  if (siteDomain) {
    origins.push(`https://${siteDomain.replace(/\/+$/, "")}`)
  }

  // Only allow localhost variants in development — never in production
  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    )
  }

  return origins
}

/**
 * Validate that a request originates from an allowed origin.
 *
 * In development mode (`NODE_ENV === 'development'`) the check is
 * always bypassed and returns `true`.
 *
 * @param request – the incoming `Request` object
 * @returns `true` when the origin is trusted, `false` otherwise
 */
export function validateOrigin(request: Request): boolean {
  // Skip validation in development
  if (process.env.NODE_ENV === "development") {
    return true
  }

  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  const allowed = getAllowedOrigins()

  // Check Origin header first (most reliable)
  if (origin) {
    return allowed.some((o) => origin === o)
  }

  // Fall back to Referer header
  if (referer) {
    return allowed.some((o) => referer.startsWith(o))
  }

  // No origin information at all → reject
  return false
}
