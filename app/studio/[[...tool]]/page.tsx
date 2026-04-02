'use client'

import dynamic from 'next/dynamic'

// Dynamic import with SSR disabled to reduce memory during dev bundling
const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-[#101112]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/60 mx-auto mb-4"></div>
          <p className="text-white/60">Loading Sanity Studio...</p>
        </div>
      </div>
    )
  }
)

// Dynamic import config to prevent eager loading
const getConfig = () => import('@/sanity.config').then((mod) => mod.default)

export default function StudioPage() {
  // Use require for sync access after dynamic load
  const config = require('@/sanity.config').default
  return <NextStudio config={config} />
}
