/**
 * CSRF origin validation utility.
 *
 * Compares the request's Origin (or Referer) header against a list of
 * allowed origins to prevent cross-site request forgery on public POST
 * endpoints.
 */

/** Safely extract the URL origin (scheme+host+port) from a raw string. */
function parseOrigin(raw: string, defaultScheme = "https"): string | null {
  try {
    const withScheme = raw.startsWith("http") ? raw : `${defaultScheme}://${raw}`
    return new URL(withScheme).origin
  } catch {
    return null
  }
}

/** Safely extract the hostname from a URL string (empty string on failure). */
function parseHostname(raw: string): string {
  try {
    const withScheme = raw.startsWith("http") ? raw : `https://${raw}`
    return new URL(withScheme).hostname
  } catch {
    return ""
  }
}

/** Push the parsed origin of a single URL into `origins` if valid. */
function addOriginIfValid(origins: string[], url: string): void {
  const o = parseOrigin(url)
  if (o) origins.push(o)
}

/** Add the www. variant of a host if the host is not already www.-prefixed. */
function addWwwVariant(origins: string[], host: string): void {
  if (!host || host.startsWith("www.")) return
  const wwwOrigin = parseOrigin(`www.${host}`)
  if (wwwOrigin) origins.push(wwwOrigin)
}

/** Collect origins contributed by NEXT_PUBLIC_BASE_URL. */
function addBaseUrlOrigins(origins: string[], baseUrl: string): void {
  addOriginIfValid(origins, baseUrl)
  const host = parseHostname(baseUrl)
  addWwwVariant(origins, host)
}

/** Collect origins contributed by VERCEL_URL / NEXT_PUBLIC_VERCEL_URL. */
function addVercelOrigins(origins: string[], vercelUrl: string): void {
  addOriginIfValid(origins, vercelUrl)
}

/** Collect origins contributed by the comma-separated NEXT_PUBLIC_SITE_DOMAIN list. */
function addSiteDomainOrigins(origins: string[], siteDomain: string): void {
  for (const part of siteDomain.split(",")) {
    const trimmed = part.trim()
    if (!trimmed) continue
    addOriginIfValid(origins, trimmed)
    // Auto-add www. variant for bare domains that aren't already www.
    if (!trimmed.startsWith("www.") && !trimmed.includes("://www.")) {
      addWwwVariant(origins, trimmed)
    }
  }
}

function getAllowedOrigins(): string[] {
  const origins: string[] = []

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl) addBaseUrlOrigins(origins, baseUrl)

  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercelUrl) addVercelOrigins(origins, vercelUrl)

  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN
  if (siteDomain) addSiteDomainOrigins(origins, siteDomain)

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
