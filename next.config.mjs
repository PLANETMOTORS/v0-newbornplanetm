/** @type {import('next').NextConfig} */
// Planet Motors - Next.js Config
const nextConfig = {
  // CRITICAL: Transpile Sanity packages to prevent duplicate bundling
  transpilePackages: ['sanity', 'next-sanity', '@sanity/vision', '@sanity/ui', '@sanity/client'],
  
  // Turbopack: explicitly set the workspace root so Turbopack doesn't
  // incorrectly infer the Next.js app directory as the project root.
  turbopack: {
    root: process.cwd(),
  },
  
  experimental: {
    webpackMemoryOptimizations: true,
    // Optimize package imports to reduce memory
    optimizePackageImports: [
      'sanity', '@sanity/ui', '@sanity/vision', '@sanity/client',
      'lucide-react', '@radix-ui/react-icons',
      'date-fns', 'recharts', 'embla-carousel-react',
      'react-hook-form', '@tanstack/react-virtual',
      'framer-motion', 'swr',
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
      { protocol: 'https', hostname: 'www.carpages.ca' },
    ],
  },

  // OWASP security headers — split CSP: strict for main site, permissive for /studio
  async headers() {
    // Shared security headers (all routes)
    const sharedHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com"), interest-cohort=()',
      },
    ]

    // Main site CSP — no unsafe-eval, tightened script-src
    const mainSiteCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https://*.stripe.com https://hebbkx1anhila5yf.public.blob.vercel-storage.com https://cdn.planetmotors.ca https://planetmotors.imgix.net https://media.cpsimg.com https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com https://www.facebook.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://cdn.sanity.io https://*.upstash.io https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com https://www.facebook.com",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    // Sanity Studio CSP — needs unsafe-eval for GROQ/Vision, broader connect-src for API
    const studioCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: data: https://cdn.sanity.io https://*.sanity.io",
      "frame-src 'self'",
      "connect-src 'self' https://*.sanity.io https://*.api.sanity.io wss://*.sanity.io https://cdn.sanity.io",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      // Main site — strict CSP (no unsafe-eval)
      {
        source: '/((?!studio).*)',
        headers: [
          ...sharedHeaders,
          { key: 'Content-Security-Policy', value: mainSiteCSP },
        ],
      },
      // Sanity Studio — permissive CSP (needs unsafe-eval for GROQ)
      {
        source: '/studio/:path*',
        headers: [
          ...sharedHeaders,
          { key: 'Content-Security-Policy', value: studioCSP },
          { key: 'X-Robots-Tag', value: 'noindex' },
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
let finalConfig = nextConfig
try {
  const { withSentryConfig } = await import("@sentry/nextjs")
  finalConfig = withSentryConfig(nextConfig, {
    org: "planet-motors",
    project: "nextjs",
    silent: true,
  })
} catch {
  // @sentry/nextjs not installed — skip Sentry integration
}

export default finalConfig
