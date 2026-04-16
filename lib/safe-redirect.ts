/**
 * Sanitize a redirectTo parameter to prevent open redirect attacks.
 *
 * Only allows relative paths that start with a single `/` (e.g. `/account`,
 * `/checkout/123`). Rejects absolute URLs, protocol-relative URLs (`//evil.com`),
 * and any path that could be interpreted as an external redirect.
 *
 * @see OWASP WSTG-SESS-04 — Open Redirect
 */
export function sanitizeRedirectTo(
  redirectTo: string | null | undefined,
  fallback = '/account',
): string {
  if (!redirectTo) return fallback

  // Must start with exactly one `/` (not `//`, not `http`, not `javascript:`)
  if (!/^\/[^/]/.test(redirectTo) && redirectTo !== '/') {
    return fallback
  }

  // Strip any embedded newlines or control characters (header injection)
  if (/[\r\n\t]/.test(redirectTo)) {
    return fallback
  }

  return redirectTo
}
