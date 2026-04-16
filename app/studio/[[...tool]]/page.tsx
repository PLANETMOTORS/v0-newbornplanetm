'use client'

import { useEffect, useState, type ComponentType } from 'react'

function StudioLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading Sanity Studio...</p>
      </div>
    </div>
  )
}

// Dynamically import the entire Sanity Studio to isolate its ~3.8 MB bundle.
// This prevents Sanity chunks from leaking into shared bundles that load on
// every page (homepage, inventory, etc.).
// Uses useEffect instead of dynamic({ ssr: false }) which Next.js 16 disallows.
export default function StudioPage() {
  const [Studio, setStudio] = useState<ComponentType | null>(null)

  useEffect(() => {
    Promise.all([
      import('next-sanity/studio'),
      import('@/sanity.config'),
    ]).then(([studioMod, configMod]) => {
      const StudioWithConfig = () => <studioMod.NextStudio config={configMod.default} />
      StudioWithConfig.displayName = 'SanityStudio'
      setStudio(() => StudioWithConfig)
    })
  }, [])

  if (!Studio) return <StudioLoading />
  return <Studio />
}
