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
    optimizePackageImports: ['sanity', '@sanity/ui', 'lucide-react', '@radix-ui/react-icons'],
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.planetmotors.ca' },
      { protocol: 'https', hostname: 'planetmotors.imgix.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.cpsimg.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },

  // OWASP security headers applied to all routes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Disable MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer leakage control  
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Force HTTPS for 1 year (Strict-Transport-Security)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Restrict powerful browser features
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com"), interest-cohort=()',
          },
          // Content-Security-Policy — strict but compatible with Stripe Embedded Checkout + Sanity Studio
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Stripe + Sanity + Vercel + GTM/GA + Meta Pixel
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.sanity.io https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
              // Styles: self + inline (Tailwind/shadcn)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: self + blob + Stripe CDN + all configured image hosts
              "img-src 'self' blob: data: https://*.stripe.com https://hebbkx1anhila5yf.public.blob.vercel-storage.com https://cdn.planetmotors.ca https://planetmotors.imgix.net https://images.unsplash.com https://media.cpsimg.com https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
              // Frames: only Stripe
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              // Connect: self + Supabase + Stripe + Sanity + Upstash
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://cdn.sanity.io https://*.upstash.io https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com https://www.facebook.com",
              // Workers for Sanity vision
              "worker-src 'self' blob:",
              // Base URI
              "base-uri 'self'",
              // Allow forms only from self
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // Stripe webhook must receive raw body — no transform
      {
        source: '/api/webhooks/stripe',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}
export default nextConfig
