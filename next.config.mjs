/** @type {import('next').NextConfig} */
// CACHE BUST: v63 - Memory optimization + complete rebuild
const nextConfig = {
  // Force complete rebuild
  cleanDistDir: true,
  
  // Experimental memory optimization
  experimental: {
    // Reduce memory usage
    optimizePackageImports: ['lucide-react', '@sanity/client', 'sanity'],
  },
  
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
  
  compress: true,
  
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
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
