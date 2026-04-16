'use client'

import dynamic from 'next/dynamic'

// Dynamically import the entire Sanity Studio to isolate its ~3.8 MB bundle.
// This prevents Sanity chunks from leaking into shared bundles that load on
// every page (homepage, inventory, etc.).
const SanityStudio = dynamic(
  () => import('next-sanity/studio').then(m => {
    // Must also dynamically import the config so @sanity/* deps stay in this chunk
    const configPromise = import('@/sanity.config')
    return configPromise.then(configMod => {
      const StudioWithConfig = () => <m.NextStudio config={configMod.default} />
      StudioWithConfig.displayName = 'SanityStudio'
      return { default: StudioWithConfig }
    })
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Sanity Studio...</p>
        </div>
      </div>
    ),
  }
)

export default function StudioPage() {
  return <SanityStudio />
}
