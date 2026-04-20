// Planet Motors Homepage Content - Trust-First Design (Clutch/Carvana Style)
// Section Order: Hero -> 4-Step Process -> Featured Vehicles -> Why Choose Us -> Sell/Trade -> Reviews -> Protection Plans -> CTA -> The Promise -> Footer
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight } from "lucide-react"
import { HomepageBelowFoldSections } from "@/components/homepage-below-fold-client"
import { HeroImageServer } from "@/components/hero-image-server"

// VehicleShowcase renders the interactive carousel on top of the server-
// rendered hero image.  Dynamic import with ssr:true so it SSRs the full
// carousel HTML, but HeroImageServer (pure Server Component) provides the
// LCP image directly — no hydration needed for the initial paint.
const VehicleShowcase = dynamic(
  () => import("@/components/vehicle-showcase").then(m => ({ default: m.VehicleShowcase })),
  { ssr: true }
)

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
              {/* Server-rendered hero image — pure Server Component, no JS
                  needed.  Paints immediately from SSR HTML so the browser
                  has a valid LCP candidate before React hydrates (~2s on 4×
                  mobile).  Positioned absolutely behind the carousel's
                  aspect-[4/3] area so the interactive VehicleShowcase can
                  render in normal document flow (preserving space for its
                  thumbnail navigation below the carousel). */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 w-full max-w-6xl mx-auto px-2 sm:px-4"
              >
                <HeroImageServer firstVehicle={showcaseVehicles?.[0] ?? null} />
              </div>

              {/* Interactive carousel overlay — dynamic import with ssr:true
                  keeps the carousel HTML in the SSR output while deferring
                  its heavy JS bundle (SWR, Supabase client, Lucide icons) to
                  a separate chunk.  Rendered in normal document flow so its
                  full height (carousel + thumbnail navigation) is reserved
                  in the layout. */}
              <div className="relative">
                <VehicleShowcase serverVehicles={showcaseVehicles ?? undefined} />
              </div>

              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-[#dc2626] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg z-10">
                Low Rates Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Below-fold sections (Mid-Fold, Featured Vehicles, Below-Fold) are
          lazy-loaded via a Client Component wrapper so that `ssr: false`
          dynamic imports stay out of this Server Component. */}
      <HomepageBelowFoldSections
        siteSettings={siteSettings}
        ratingValue={ratingValue}
        lowestRate={lowestRate}
        weekdayHours={weekdayHours}
        saturdayHours={saturdayHours}
      />

    </section>
  )
}