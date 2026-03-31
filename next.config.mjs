import { join } from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force clean build - version 35
  cleanDistDir: true,
  // PERMANENT FIX: Turbopack configuration for path alias resolution
  // The resolveAlias explicitly maps @/* imports to the project directory
  // This works regardless of where Next.js is invoked from or workspace structure
  turbopack: {
    resolveAlias: {
      '@/lib/*': './lib/*',
      '@/components/*': './components/*',
      '@/app/*': './app/*',
      '@/hooks/*': './hooks/*',
      '@/styles/*': './styles/*',
      '@/*': './*',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/imgix-loader.ts',
    // AVIF-first for 50% smaller files, WebP fallback for older browsers
    formats: ['image/avif', 'image/webp'],
    // Mobile-first breakpoints optimized for <1s load time
    // Prioritize mobile sizes (320-828px) for 20,000 monthly visitors
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920],
    // Thumbnail sizes for vehicle grid cards
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 384],
    // 30-day CDN cache for 9,500+ vehicle images
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.planetmotors.ca',
      },
      {
        protocol: 'https',
        hostname: 'planetmotors.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'media.cpsimg.com',
      },
    ],
  },
  // Performance optimizations for mobile
  experimental: {
    optimizeCss: true,
  },
  // Gzip/Brotli compression
  compress: true,
  // HTTP headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Preconnect hints for imgix CDN
          { key: 'Link', value: '<https://planetmotors.imgix.net>; rel=preconnect' },
        ],
      },
    ]
  },
}

export default nextConfig
