// Planet Motors Homepage - v21 - Performance Optimized
import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomepageContent } from "@/components/homepage-content"
import { getSiteSettings, getTestimonials, getFaqs } from "@/lib/sanity/fetch"
import { createClient } from "@/lib/supabase/server"

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
// HTML with a <link rel="preload">. Passed to VehicleShowcase as SWR fallbackData
// so vehicle metadata and images are consistent from the first render.
async function getShowcaseVehicles() {
  try {
    const supabase = await createClient()
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

// Async component that fetches CMS data — streamed via Suspense
async function HomepageWithData() {
  const [siteSettings, testimonials, faqs, showcaseVehicles] = await Promise.all([
    withTimeout(getSiteSettings(), null),
    withTimeout(getTestimonials(), []),
    withTimeout(getFaqs(), []),
    withTimeout(getShowcaseVehicles(), null),
  ])

  return (
    <HomepageContent
      siteSettings={siteSettings ?? DEFAULT_SITE_SETTINGS}
      testimonials={testimonials ?? []}
      faqs={faqs ?? []}
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
      <main className="flex-1">
        <Suspense fallback={<HomepageSkeleton />}>
          <HomepageWithData />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
