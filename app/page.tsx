// Planet Motors Homepage - v24 - ISR + LCP Preload
// Key perf wins:
//   1. ISR (revalidate=60) — page is statically generated, rebuilt every 60s
//   2. Cookie-less Supabase client — no cookies() call = ISR-compatible
//   3. Only hero-critical data blocks render (siteSettings + vehicles)
//   4. Below-fold data (testimonials, FAQs) fetched client-side by HomepageBelowFold
//   5. Server-side preload hint for the LCP hero image
import { Suspense } from "react"
import { preload } from "react-dom"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { HomepageContent } from "@/components/homepage-content"

// Lazy-load the footer since it's always below the fold
const Footer = dynamic(() => import("@/components/footer").then(m => ({ default: m.Footer })), { ssr: true })
import { getSiteSettings } from "@/lib/sanity/fetch"
import { createStaticClient } from "@/lib/supabase/static"

// ISR: regenerate the homepage at most every 60 seconds.
// Combined with Sanity CDN caching and the stateless Supabase client,
// this means most visitors get a pre-built HTML page instantly.
export const revalidate = 60

// Default site settings - fallback when CMS is unavailable or slow
const DEFAULT_SITE_SETTINGS = {
  dealerName: "Planet Motors",
  phone: "1-866-797-3332",
  email: "info@planetmotors.ca",
  streetAddress: "30 Major Mackenzie Dr E",
  city: "Richmond Hill",
  province: "ON",
  postalCode: "L4C 1G7",
}

// Timeout wrapper — if Sanity takes >3s, use fallback so we don't block the page
async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 3000): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ])
  } catch {
    return fallback
  }
}

// Fetch showcase vehicles server-side so the LCP hero image is in the initial
// HTML with a <link rel="preload">. Uses the stateless client (no cookies())
// so the page remains ISR-eligible.
async function getShowcaseVehicles() {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, year, make, model, trim, price, mileage, fuel_type, inspection_score, is_new_arrival, primary_image_url, image_urls')
      .eq('status', 'available')
      .order('price', { ascending: false })
      .limit(6)
    if (error || !data?.length) return null
    return data
  } catch {
    return null
  }
}

// Async component — only fetches hero-critical data.
// Testimonials & FAQs are now fetched client-side by HomepageBelowFold
// so they don't delay the initial HTML / LCP image.
async function HomepageWithData() {
  const [siteSettings, showcaseVehicles] = await Promise.all([
    withTimeout(getSiteSettings(), null),
    withTimeout(getShowcaseVehicles(), null),
  ])

  // Preload the LCP hero image — the first showcase vehicle image.
  // Uses imageSrcSet + imageSizes so the browser picks the exact same URL
  // that the <Image sizes="(max-width: 768px) 100vw, 50vw"> component will
  // request, avoiding "preloaded but not used" mismatches across DPRs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row shape
  const firstVehicle = showcaseVehicles?.[0] as any
  const firstImage: string | undefined = firstVehicle?.primary_image_url
    || (firstVehicle?.image_urls && firstVehicle.image_urls[0])
  if (firstImage) {
    const encodedUrl = encodeURIComponent(firstImage)
    // deviceSizes from next.config.mjs — must match exactly
    const widths = [640, 750, 828, 1080, 1200, 1920]
    const srcSet = widths.map(w => `/_next/image?url=${encodedUrl}&w=${w}&q=75 ${w}w`).join(', ')
    // href is the fallback; imageSrcSet lets the browser pick the right width
    const fallbackUrl = `/_next/image?url=${encodedUrl}&w=1920&q=75`
    preload(fallbackUrl, {
      as: 'image',
      imageSrcSet: srcSet,
      imageSizes: '(max-width: 768px) 100vw, 50vw',
      fetchPriority: 'high',
    } as Parameters<typeof preload>[1])
  }

  return (
    <HomepageContent
      siteSettings={siteSettings ?? DEFAULT_SITE_SETTINGS}
      showcaseVehicles={showcaseVehicles}
    />
  )
}

// Lightweight skeleton shown instantly while CMS data loads
function HomepageSkeleton() {
  return (
    <div className="min-h-[600px] bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-12 w-1/2 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="h-5 w-full bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse mb-8" />
            <div className="flex gap-4">
              <div className="h-12 w-40 bg-blue-200 rounded-full animate-pulse" />
              <div className="h-12 w-40 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Suspense fallback={<HomepageSkeleton />}>
          <HomepageWithData />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
