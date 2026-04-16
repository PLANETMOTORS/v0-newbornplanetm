import Link from 'next/link'

// Sanity Studio is disabled pre-launch to eliminate 3.8MB client bundle.
// Re-enable after launch by restoring the NextStudio import:
//   import { NextStudio } from 'next-sanity/studio'
//   import config from '@/sanity.config'
//   export default function StudioPage() { return <NextStudio config={config} /> }

export default function StudioPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sanity Studio</h1>
        <p className="text-gray-600 mb-6">
          The CMS editor will be activated after the website launch.
          Content is currently managed directly in the Sanity dashboard.
        </p>
        <Link
          href="https://www.sanity.io/manage"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Open Sanity Dashboard →
        </Link>
        <p className="mt-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  )
}
