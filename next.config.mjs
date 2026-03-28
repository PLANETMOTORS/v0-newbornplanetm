/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force clean build - version 7 - Supabase env vars configured
  cleanDistDir: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
