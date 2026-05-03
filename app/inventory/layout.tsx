import { Metadata } from "next"
import { createStaticClient } from '@/lib/supabase/static'

// ISR: cache the layout (and its preload hints) for 2 minutes
export const revalidate = 120

// Post-launch P2 (see docs/POST_LAUNCH_FIXES.md item #9):
//   Convert this to `generateMetadata({ searchParams })` and self-canonicalise
//   the curated filter URLs already listed in lib/sitemap-builders.ts (e.g.
//   /inventory?fuelType=Electric, /inventory?make=Tesla). Today every variant
//   collapses to /inventory base, which protects against index bloat but
//   prevents curated landing pages from ranking separately.
export const metadata: Metadata = {
  title: "Used EVs & Certified Pre-Owned Vehicles in Canada | Planet Motors",
  description: "Browse Aviloo-certified used EVs, hybrids, and SUVs. 210-point inspected, free Carfax. Canada-wide delivery. Financing from 6.29% APR. Filter by make, model, price, and fuel type.",
  keywords: [
    "used EVs Canada",
    "certified pre-owned vehicles",
    "Aviloo certified used cars",
    "electric vehicles for sale",
    "used Tesla Canada",
    "used BMW Canada",
    "car inventory Richmond Hill",
    "Planet Motors inventory",
  ].join(", "),
  alternates: {
    canonical: "/inventory",
  },
  openGraph: {
    title: "Used EVs & Certified Pre-Owned Vehicles in Canada | Planet Motors",
    description: "Browse Aviloo-certified used EVs, hybrids, and SUVs. 210-point inspected. Canada-wide delivery. Financing from 6.29% APR.",
    url: "/inventory",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Used EVs & Certified Pre-Owned | Planet Motors",
    description: "Aviloo-certified used EVs. 210-point inspected. Canada-wide delivery.",
  },
}

/** Next.js image optimizer deviceSizes from next.config.mjs */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920]

function buildSrcSet(src: string): string {
  return DEVICE_SIZES.map(
    w => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`
  ).join(', ')
}

const REAL_IMG = ['.jpg', '.png', '.webp', 'cdn.planetmotors.ca', 'imgix.net', 'homenetiol.com', 'cpsimg.com']

function isRealImage(url: string | null | undefined): url is string {
  if (!url) return false
  if (url.includes('unsplash.com') || url.includes('planetmotors.ca/inventory')) return false
  return REAL_IMG.some(ind => url.includes(ind))
}

/** Race a promise against a timeout — returns fallback if the promise is too slow. */
function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * Server Component layout — fetches the first 4 vehicle image URLs and
 * renders `<link rel="preload" as="image">` tags hoisted to <head>.
 * Eliminates the 1.5s "resource load delay" Lighthouse reports because
 * the browser discovers LCP images in the initial HTML.
 *
 * The Supabase query is wrapped in a 2s timeout so a slow DB response
 * doesn't block the entire layout render — the page loads instantly
 * and the client-side fetcher picks up the images normally.
 */
export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  let preloadUrls: string[] = []

  try {
    const supabase = createStaticClient()
    const queryPromise = Promise.resolve(
      supabase
        .from('vehicles')
        .select('primary_image_url')
        .in('status', ['available', 'reserved'])
        .order('created_at', { ascending: false })
        .limit(8)
    ).then(res => res.data as Record<string, unknown>[] | null)

    // 2s timeout — if Supabase is slow, skip preloads rather than blocking TTFB
    const data = await withTimeout(queryPromise, null, 2000)

    if (data) {
      preloadUrls = data
        .map(v => v.primary_image_url as string | null)
        .filter(isRealImage)
        .slice(0, 4)
    }
  } catch {
    // Supabase unavailable — skip preloads, client will fetch normally
  }

  return (
    <>
      {/* Preload above-fold vehicle images — hoisted to <head> by Next.js */}
      {preloadUrls.map(url => (
        <link
          key={url}
          rel="preload"
          as="image"
          imageSrcSet={buildSrcSet(url)}
          imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fetchPriority="high"
        />
      ))}
      {children}
    </>
  )
}
