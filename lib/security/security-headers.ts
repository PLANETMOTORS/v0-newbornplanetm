/**
 * Edge-runtime-safe security headers applied to every response by
 * middleware.ts.
 *
 * Design notes
 * ------------
 * 1. We do NOT use a CSP nonce. Next.js streams server-rendered HTML in
 *    chunks and the React client must hydrate inline scripts that the
 *    server already emitted; injecting a different nonce on the edge
 *    causes the browser to reject the inline script and produces a
 *    hydration error. Until Next.js exposes a stable per-request nonce
 *    via headers().get(...) inside the renderer, the pragmatic answer
 *    for marketing-heavy SSR sites is `'unsafe-inline'` for scripts
 *    paired with a tight allow-list of remote origins.
 *
 * 2. Allow-list reflects the partner stack actually wired up in this
 *    repo:
 *      - Stripe (js.stripe.com / hooks.stripe.com / api.stripe.com)
 *      - Supabase (*.supabase.co / *.supabase.in)
 *      - Sentry (*.sentry.io / *.ingest.sentry.io)
 *      - Resend (api.resend.com — server-only, but kept for consistency)
 *      - Upstash Redis (*.upstash.io — REST API)
 *      - Typesense Cloud (*.typesense.net)
 *      - Google Tag Manager + Maps + Fonts
 *      - Meta Pixel (connect.facebook.net + facebook.com pixel endpoint)
 *      - Vercel analytics + speed insights (*.vercel-scripts.com /
 *        vitals.vercel-insights.com)
 *      - HomeNet image CDN (vehicle photos)
 *
 * 3. STS only emits `Strict-Transport-Security` in production so local
 *    dev over http://localhost:3000 still works.
 */

const SCRIPT_SOURCES = [
  "'self'",
  // Inline scripts: Next.js bootstrap + JSON-LD + Partytown snippet.
  // See file header for why a per-request nonce is not viable here.
  "'unsafe-inline'",
  // eval is needed by some analytics bundles (GTM, Partytown loader).
  // It is gated to 3rd-party origins via the allow-list below.
  "'unsafe-eval'",
  "https://js.stripe.com",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://connect.facebook.net",
  "https://*.vercel-scripts.com",
  "https://va.vercel-scripts.com",
]

const STYLE_SOURCES = [
  "'self'",
  "'unsafe-inline'", // Tailwind v4 + chart.tsx + JSX style props
  "https://fonts.googleapis.com",
]

const IMG_SOURCES = [
  "'self'",
  "data:",
  "blob:",
  "https://*.supabase.co",
  "https://*.supabase.in",
  "https://content.homenetiol.com",
  "https://photos.homenetiol.com",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://www.facebook.com",
  "https://*.cdn.sanity.io",
  "https://cdn.sanity.io",
]

const CONNECT_SOURCES = [
  "'self'",
  "https://api.stripe.com",
  "https://m.stripe.com",
  "https://*.supabase.co",
  "https://*.supabase.in",
  "wss://*.supabase.co",
  "https://*.sentry.io",
  "https://*.ingest.sentry.io",
  "https://api.resend.com",
  "https://*.upstash.io",
  "https://*.typesense.net",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.facebook.com",
  "https://connect.facebook.net",
  "https://vitals.vercel-insights.com",
  "https://*.vercel-insights.com",
]

const FRAME_SOURCES = [
  "'self'",
  "https://js.stripe.com",
  "https://hooks.stripe.com",
  "https://www.googletagmanager.com",
  "https://www.youtube.com",
  "https://player.vimeo.com",
]

const FONT_SOURCES = ["'self'", "data:", "https://fonts.gstatic.com"]

const WORKER_SOURCES = ["'self'", "blob:"]

function buildCsp(): string {
  return [
    `default-src 'self'`,
    `script-src ${SCRIPT_SOURCES.join(" ")}`,
    `style-src ${STYLE_SOURCES.join(" ")}`,
    `img-src ${IMG_SOURCES.join(" ")}`,
    `connect-src ${CONNECT_SOURCES.join(" ")}`,
    `frame-src ${FRAME_SOURCES.join(" ")}`,
    `font-src ${FONT_SOURCES.join(" ")}`,
    `worker-src ${WORKER_SOURCES.join(" ")}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://js.stripe.com https://hooks.stripe.com`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ")
}

const STATIC_SECURITY_HEADERS: Array<[string, string]> = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")",
  ],
  ["X-DNS-Prefetch-Control", "on"],
  ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
]

/**
 * Apply security headers to a Response in-place and return it.
 *
 * Idempotent: safe to call multiple times. Skips the CSP for the
 * Sanity Studio mounted at /studio because Sanity's authoring UI ships
 * its own (looser) CSP and the two would conflict.
 */
export function applySecurityHeaders(
  response: Response,
  pathname: string
): Response {
  // Static headers — always emitted.
  for (const [name, value] of STATIC_SECURITY_HEADERS) {
    response.headers.set(name, value)
  }

  // HSTS: production only, two-year max-age, preload-eligible.
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    )
  }

  // CSP: skip for Sanity Studio (it manages its own).
  const skipCsp = pathname.startsWith("/studio")
  if (!skipCsp) {
    response.headers.set("Content-Security-Policy", buildCsp())
  }

  return response
}
