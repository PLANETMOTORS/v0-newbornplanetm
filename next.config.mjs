/** @type {import('next').NextConfig} */
// CACHE BUST: v59 - ALL Sanity files verified: client.ts, types.ts, fetch.ts, site-data.ts
const nextConfig = {
  // Force complete rebuild - Sanity files verified
  cleanDistDir: true,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/imgix-loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 384],
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
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  experimental: {
    // Empty - no experimental features needed
  },
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Link', value: '<https://planetmotors.imgix.net>; rel=preconnect' },
        ],
      },
    ]
  },
}

export default nextConfig
