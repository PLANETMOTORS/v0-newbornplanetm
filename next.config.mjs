/** @type {import('next').NextConfig} */
// Planet Motors - Next.js Config v64 - Sanity Memory Fix
const nextConfig = {
  // CRITICAL: Transpile Sanity packages to prevent duplicate bundling
  transpilePackages: ['sanity', 'next-sanity', '@sanity/vision', '@sanity/ui', '@sanity/client'],
  
  experimental: {
    webpackMemoryOptimizations: true,
    // Optimize package imports to reduce memory
    optimizePackageImports: ['sanity', '@sanity/ui', 'lucide-react', '@radix-ui/react-icons'],
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
