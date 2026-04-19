// Planet Motors Homepage Content - Trust-First Design (Clutch/Carvana Style)
// Section Order: Hero -> 4-Step Process -> Featured Vehicles -> Why Choose Us -> Sell/Trade -> Reviews -> Protection Plans -> CTA -> The Promise -> Footer
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"

// Code-split heavy below-fold sections into separate chunks.
// ssr: false keeps these bundles out of the initial HTML + hydration
// payload entirely, so the browser can paint the LCP hero image before
// parsing / evaluating their JavaScript on a throttled mobile CPU.
const HomepageFeaturedVehicles = dynamic(
  () => import("@/components/homepage-featured-vehicles").then(m => ({ default: m.HomepageFeaturedVehicles })),
  { ssr: false, loading: () => <FeaturedVehiclesSkeleton /> }
)

// Lazy-load mid-fold sections (Shop By Category + 4-Step Process)
const HomepageMidFold = dynamic(
  () => import("@/components/homepage-mid-fold").then(m => ({ default: m.HomepageMidFold })),
  { ssr: false, loading: () => <MidFoldSkeleton /> }
)

// Lazy-load below-fold sections
const HomepageBelowFold = dynamic(
  () => import("@/components/homepage-below-fold").then(m => ({ default: m.HomepageBelowFold })),
  { ssr: false, loading: () => <BelowFoldSkeleton /> }
)

// VehicleShowcase is the above-fold hero (LCP element).
// Dynamic import with ssr:true keeps the hero image in the SSR HTML
// (so it paints immediately) while deferring the JS bundle (SWR,
// Supabase client, Lucide icons) to a separate chunk. This lets the
// browser paint the hero image before the heavy JS blocks the main
// thread — critical for mobile LCP.
const VehicleShowcase = dynamic(
  () => import("@/components/vehicle-showcase").then(m => ({ default: m.VehicleShowcase })),
  { ssr: true }
)

// Lightweight loading skeletons to prevent layout shift while chunks load
function FeaturedVehiclesSkeleton() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function MidFoldSkeleton() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-6 animate-pulse" />
        <div className="flex gap-3 justify-center flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-10 w-28 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function BelowFoldSkeleton() {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-56 bg-gray-200 rounded mx-auto mb-8 animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

export type HomepageProps = {
  siteSettings: {
    dealerName: string
    phone: string
    email: string
    streetAddress: string
    city: string
    province: string
    postalCode: string
    aggregateRating?: {
      ratingValue: number
      reviewCount: number
    }
    financingDefaults?: {
      annualInterestRate: number
    }
    businessHours?: Array<{
      day: string
      open: string
      close: string
      isClosed: boolean
    }>
  }
  showcaseVehicles?: Array<{
    id: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    mileage: number
    fuel_type?: string
    is_new_arrival?: boolean
    inspection_score?: number
    primary_image_url?: string
    image_urls?: string[]
  }> | null
}




export function HomepageContent({ siteSettings, showcaseVehicles }: HomepageProps) {
  const ratingValue = siteSettings.aggregateRating?.ratingValue || 4.8
  const lowestRate = siteSettings.financingDefaults?.annualInterestRate || 6.29

  // Get business hours for display
  const weekdayHours = siteSettings.businessHours?.find(h => h.day === "Monday")
  const saturdayHours = siteSettings.businessHours?.find(h => h.day === "Saturday")

  return (
    <section id="home-hero-section" aria-label="Home page content" className="overflow-x-hidden max-w-full">
      {/* ========== BOX 2: HERO SECTION - Off-White #F9FAFB ========== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left min-w-0">
              <h1 className="font-serif text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-gray-900">
                The Smarter Way to
                <span className="block text-[#1e3a8a]">
                  Buy or Sell Your Car
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 min-h-[3rem] sm:min-h-[3.5rem]">
                Ontario&apos;s #1 certified pre-owned marketplace.
                <br className="hidden sm:block" />
                <span className="font-semibold text-gray-800">210-point inspected.</span> Delivered to your door.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start min-h-[3.5rem] sm:min-h-[3rem]">
                <a
                  href="/inventory"
                  data-testid="hero-cta-btn"
                  className="inline-flex items-center gap-2 sm:gap-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-base sm:text-lg font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-lg shadow-red-600/25 transition-all hover:shadow-xl hover:shadow-red-600/30"
                >
                  <span>Find Your Car</span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                </a>
                <Link
                  href="/trade-in"
                  className="inline-flex items-center gap-2 sm:gap-3 border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white text-base sm:text-lg font-semibold px-6 sm:px-8 py-3 sm:py-[14px] rounded-full transition-all"
                >
                  <span>Get Trade-In Value</span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                </Link>
              </div>


            </div>

            {/* Hero Image / Vehicle Showcase */}
            <div className="relative min-w-0">
              <VehicleShowcase serverVehicles={showcaseVehicles ?? undefined} />
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-[#dc2626] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg z-10">
                Low Rates Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-fold sections: Shop By Category + 4-Step Process (lazy-loaded) */}
      <HomepageMidFold />

      {/* ========== BOX 3: FEATURED VEHICLES - Pure White #FFFFFF ========== */}
      <HomepageFeaturedVehicles />

      {/* Below-fold sections: lazy-loaded, fetches its own testimonials */}
      <HomepageBelowFold
        siteSettings={siteSettings}
        ratingValue={ratingValue}
        lowestRate={lowestRate}
        weekdayHours={weekdayHours}
        saturdayHours={saturdayHours}
      />

    </section>
  )
}