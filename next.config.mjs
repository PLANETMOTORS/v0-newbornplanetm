/** @type {import('next').NextConfig} */
// Planet Motors - Next.js Config v63 - Minimal + Memory Optimized
const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
}
export default nextConfig
