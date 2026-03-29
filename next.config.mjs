/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force clean build - version 12 - LockKeyhole verified, cache cleared
  cleanDistDir: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/imgix-loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
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
    ],
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
  },
  // Compression
  compress: true,
}

export default nextConfig
