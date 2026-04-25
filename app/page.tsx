// Planet Motors Homepage - v25 - ISR + Direct Hero Rendering (no Suspense)
// Key perf wins:
//   1. ISR (revalidate=60) — page is statically generated, rebuilt every 60s
//   2. Cookie-less Supabase client — no cookies() call = ISR-compatible
//   3. Async page with NO Suspense boundary — hero image lands in the main
//      visible DOM instead of React's hidden streaming <div>. This eliminates
//      the ~2s element render delay caused by waiting for JS to swap content.
//   4. Server-side preload hint for the LCP hero image
//   5. Below-fold data (testimonials, FAQs) fetched client-side
import type { Metadata } from "next"
import { preload } from "react-dom"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { HomepageContent } from "@/components/homepage-content"
import { PHONE_TOLL_FREE, EMAIL_INFO, DEALERSHIP_LOCATION } from "@/lib/constants/dealership"

// Lazy-load the footer — code-split into a separate chunk while keeping
// its HTML in the SSR output for SEO (crawlers see footer links/contact).
const Footer = dynamic(() => import("@/components/footer").then(m => ({ default: m.Footer })), { ssr: true })
import { getSiteSettings, getHomepageData } from "@/lib/sanity/fetch"
import { createStaticClient } from "@/lib/supabase/static"

// ISR: regenerate the homepage at most every 60 seconds.
export const revalidate = 60

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

// Default site settings - fallback when CMS is unavailable or slow
const DEFAULT_SITE_SETTINGS = {
  dealerName: DEALERSHIP_LOCATION.name,
  phone: PHONE_TOLL_FREE,
  email: EMAIL_INFO,
  streetAddress: DEALERSHIP_LOCATION.streetAddress,
  city: DEALERSHIP_LOCATION.city,
  province: DEALERSHIP_LOCATION.province,
  postalCode: DEALERSHIP_LOCATION.postalCode,
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

const VEHICLE_COLUMNS = 'id, year, make, model, trim, price, mileage, fuel_type, inspection_score, is_new_arrival, primary_image_url, image_urls'

type ShowcaseVehicle = {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  price: number
  mileage: number
  fuel_type?: string
  inspection_score?: number
  is_new_arrival?: boolean
  primary_image_url?: string
  image_urls?: string[]
}

// Fetch specific vehicles by ID (admin-curated from Sanity).
async function getFeaturedVehiclesById(ids: string[]): Promise<ShowcaseVehicle[] | null> {
  if (!ids.length) return null
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select(VEHICLE_COLUMNS)
      .in('id', ids)
      .eq('status', 'available')
    if (error || !data?.length) return null
    // Preserve Sanity ordering
    const rows = data as ShowcaseVehicle[]
    const byId = new Map(rows.map(v => [v.id, v]))
    return ids.map(id => byId.get(id)).filter((v): v is ShowcaseVehicle => v != null)
  } catch {
    return null
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
      .select(VEHICLE_COLUMNS)
      .eq('status', 'available')
      .order('price', { ascending: false })
      .limit(6)
    if (error || !data?.length) return null
    return data
  } catch {
    return null
  }
}

// Async page component — fetches data directly at the top level.
// With ISR (revalidate=60), this resolves at build time. By NOT wrapping
// the hero in <Suspense>, React renders the hero image directly into the
// visible DOM — the browser can paint it immediately without waiting for
// JavaScript to swap hidden streaming content.
export default async function HomePage() {
  const [siteSettings, homepageData, autoShowcaseVehicles] = await Promise.all([
    withTimeout(getSiteSettings(), null),
    withTimeout(getHomepageData(), null),
    withTimeout(getShowcaseVehicles(), null),
  ])

  // Prefer admin-curated featured vehicles from Sanity; fall back to auto-selected
  const featuredIds: string[] = (homepageData as Record<string, unknown>)?.featuredVehicleIds as string[] ?? []
  const curatedVehicles = featuredIds.length
    ? await withTimeout(getFeaturedVehiclesById(featuredIds), null)
    : null
  const showcaseVehicles = curatedVehicles ?? autoShowcaseVehicles

  // Preload the LCP hero image — the first showcase vehicle image.
  // Uses imageSrcSet + imageSizes so the browser picks the exact same URL
  // that the <Image sizes="(max-width: 768px) 100vw, 50vw"> component will
  // request, avoiding "preloaded but not used" mismatches across DPRs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row shape
  const firstVehicle = showcaseVehicles?.[0] as any
  const firstImage: string | undefined = firstVehicle?.primary_image_url
    || (firstVehicle?.image_urls?.[0])
  if (firstImage) {
    const encodedUrl = encodeURIComponent(firstImage)
    // deviceSizes from next.config.mjs — must match exactly
    const widths = [640, 750, 828, 1080, 1200, 1920]
    const srcSet = widths.map(w => `/_next/image?url=${encodedUrl}&w=${w}&q=75 ${w}w`).join(', ')
    preload('', {
      as: 'image',
      imageSrcSet: srcSet,
      imageSizes: '(max-width: 768px) 100vw, 50vw',
      fetchPriority: 'high',
    } as Parameters<typeof preload>[1])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <HomepageContent
          siteSettings={siteSettings ?? DEFAULT_SITE_SETTINGS}
          homepageData={homepageData}
          showcaseVehicles={showcaseVehicles}
        />
      </main>
      <Footer />
    </div>
  )
}
