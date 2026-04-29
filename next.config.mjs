 
import withBundleAnalyzer from '@next/bundle-analyzer'

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
// Planet Motors - Next.js Config
const nextConfig = {
  // Enforce React strict mode — catches double-render bugs, deprecated APIs
  reactStrictMode: true,

  // Enable gzip/brotli compression for all responses
  compress: true,

  // SEC-06: Remove x-powered-by: Next.js header (OWASP WSTG-CONF-08)
  poweredByHeader: false,

  // Transpile Sanity client to prevent duplicate bundling
  transpilePackages: ['@sanity/client'],

  // Exclude native Node.js modules from bundling (required for ssh2/sftp in API routes)
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client', 'cpu-features'],
  
  // Turbopack: explicitly set the workspace root so Turbopack doesn't
  // incorrectly infer the Next.js app directory as the project root.
  turbopack: {
    root: process.cwd(),
  },
  
  experimental: {
    webpackMemoryOptimizations: true,
    // Optimize package imports to reduce memory
    optimizePackageImports: [
      '@sanity/client',
      'lucide-react', '@radix-ui/react-icons',
      'date-fns', 'recharts', 'embla-carousel-react',
      'react-hook-form', '@tanstack/react-virtual',
      'framer-motion', 'swr',
      '@supabase/supabase-js', '@vercel/analytics', '@vercel/speed-insights',
      'sonner', '@stripe/stripe-js', '@stripe/react-stripe-js',
      'zod', '@sentry/nextjs',
    ],
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    // Responsive breakpoints tuned for vehicle card grid (1-3 cols)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Serve optimised images from the edge for 60 s, revalidate in background for 1 day
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.planetmotors.ca' },
      { protocol: 'https', hostname: 'planetmotors.imgix.net' },
      { protocol: 'https', hostname: 'media.cpsimg.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'photos.homenetiol.com' },
      { protocol: 'https', hostname: 'content.homenetiol.com' },
      { protocol: 'https', hostname: 'www.carpages.ca' },
      { protocol: 'https', hostname: 'ldervbcvkoawwknsemuz.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // SEO redirects — consolidate old URLs to canonical paths
  async redirects() {
    // ── Existing internal redirects ──
    const internalRedirects = [
      {
        source: '/warranty',
        destination: '/protection-plans',
        permanent: true,
      },
      {
        source: '/ev-battery-health',
        destination: '/aviloo',
        permanent: true,
      },
    ]

    // ── CarPages legacy URL redirects (domain cutover April 26) ──
    // Each row maps a former CarPages path to the canonical Next.js route.
    // Populated from Tony's CarPages URL CSV — add rows as they arrive.
    const carPagesRedirects = [
      { source: '/our-team', destination: '/about', permanent: true },
      // NOTE: Do NOT add /used-cars/:path* — it breaks the 20 city SEO
      // landing pages at app/used-cars/[city]/page.tsx (toronto, vancouver, etc.)
      // Only redirect the bare /used-cars path. CarPages vehicle sub-paths will 404,
      // which is correct — they have no equivalent in the new site.
      { source: '/used-cars', destination: '/inventory', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/car-financing', destination: '/financing', permanent: true },
      { source: '/trade-in-value', destination: '/trade-in', permanent: true },
      { source: '/testimonials', destination: '/about', permanent: true },
      // TODO: Add remaining rows from Tony's CarPages CSV when delivered
    ]

    // ── ev.planetmotors.ca → www.planetmotors.ca (post-cutover) ──
    // Vercel handles domain-level redirects via project settings.
    // These path-level redirects catch any deep links that resolve here.

    return [...internalRedirects, ...carPagesRedirects]
  },

  // Rewrite /sitemap.xml to the API route handler (works locally + Vercel)
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ]
  },

  // OWASP security headers — split CSP: strict for main site, permissive for /studio
  async headers() {
    // Shared security headers (all routes)
    const sharedHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com"), interest-cohort=()',
      },
    ]

    // Main site CSP — tightened script-src
    // Each directive is built from an array so diffs are one-domain-per-line.
    // NOTE: 'unsafe-eval' is required because Zod v4 uses Function('') for
    // eval capability detection and Function(...args) for schema compilation.
    // Without it, Chrome logs a CSP violation to the Issues panel, which
    // causes Lighthouse Best Practices to drop from 100 to 96.
    // See: https://github.com/colinhacks/zod/issues/4368
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://js.stripe.com',           // Stripe payments
      'https://va.vercel-scripts.com',    // Vercel Analytics
      'https://www.googletagmanager.com', // GTM
      'https://www.google-analytics.com', // GA4
      'https://cdn.jsdelivr.net',         // Open-source CDN (widgets)
      'https://stapecdn.com',             // Stape server-side tagging CDN
      'https://googleads.g.doubleclick.net',  // Google Ads conversion scripts
      'https://www.googleadservices.com',     // Google Ads services
    ]

    const styleSrc = [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ]

    const imgSrc = [
      "'self'",
      'blob:',
      'data:',
      'https://*.stripe.com',
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'https://cdn.planetmotors.ca',
      'https://planetmotors.imgix.net',
      'https://media.cpsimg.com',
      'https://cdn.sanity.io',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://content.homenetiol.com',
      'https://photos.homenetiol.com',
      'https://ldervbcvkoawwknsemuz.supabase.co',
      'https://images.unsplash.com',

      'https://www.google.com',              // Remarketing pixel
      'https://www.google.ca',               // Remarketing pixel (CA localized)
      'https://googleads.g.doubleclick.net',  // Ads conversion pixel
      'https://www.googleadservices.com',     // Google Ads pixel
      'https://capig.planetmotors.ca',        // Server-side tagging pixel
      'https://pagead2.googlesyndication.com', // Google Ads CCM image pixel
    ]

    const frameSrc = [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://www.googletagmanager.com',
      'https://capig.planetmotors.ca',        // Server-side tagging iframe
      'https://td.doubleclick.net',           // DoubleClick tracking frame
      'https://iframe-b8b2c.web.app',        // Drivee 360° viewer iframe
    ]

    const connectSrc = [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.stripe.com',
      'https://cdn.sanity.io',
      'https://*.upstash.io',
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://capig.planetmotors.ca',            // GA4 server-side proxy
      'https://www.google.com',                    // Remarketing + CCM
      'https://googleads.g.doubleclick.net',       // Google Ads data
      'https://www.merchant-center-analytics.goog', // Google Merchant Center
      'https://pagead2.googlesyndication.com',     // Google Ads CCM collect
    ]

    const mainSiteCSP = [
      "default-src 'self'",
      `script-src ${scriptSrc.join(' ')}`,
      `style-src ${styleSrc.join(' ')}`,
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src ${imgSrc.join(' ')}`,
      `frame-src ${frameSrc.join(' ')}`,
      `connect-src ${connectSrc.join(' ')}`,
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      // Main site — strict CSP
      {
        source: '/(.*)',
        headers: [
          ...sharedHeaders,
          { key: 'Content-Security-Policy', value: mainSiteCSP },
        ],
      },
      // Stripe webhook
      {
        source: '/api/webhooks/stripe',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

// Sentry wrapper — only applied when @sentry/nextjs is installed
let finalConfig = analyzeBundles(nextConfig)
try {
  const { withSentryConfig } = await import("@sentry/nextjs")
  finalConfig = withSentryConfig(analyzeBundles(nextConfig), {
    org: "planet-motors",
    project: "nextjs",
    silent: true,
  })
} catch {
  // @sentry/nextjs not installed — skip Sentry integration
}

export default finalConfig
