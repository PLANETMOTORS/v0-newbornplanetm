/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 features
  experimental: {
    ppr: true, // Partial Prerendering
    reactCompiler: true, // React 19 Compiler
  },
  // Force clean build - cache version 4
  cleanDistDir: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
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
    ],
  },
}

export default nextConfig
