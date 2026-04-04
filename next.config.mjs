import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
// Planet Motors - Next.js Config v67 - Performance Optimizations
const nextConfig = {
  // CRITICAL: Transpile Sanity packages to prevent duplicate bundling
  transpilePackages: ['sanity', 'next-sanity', '@sanity/vision', '@sanity/ui', '@sanity/client'],
  
  // Turbopack configuration - use absolute path for root
  turbopack: {
    root: __dirname,
  },
  
  experimental: {
    webpackMemoryOptimizations: true,
    // Optimize package imports to reduce memory and bundle size
    optimizePackageImports: ['sanity', '@sanity/ui', 'lucide-react', '@radix-ui/react-icons', 'date-fns', 'framer-motion'],
  },
  
  typescript: { ignoreBuildErrors: true },
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
