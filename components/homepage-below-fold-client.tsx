"use client"

// Client-only wrapper around the below-fold homepage sections.
// `ssr: false` dynamic imports are illegal inside a Server Component, so
// these imports live here and are rendered from the server-side
// `HomepageContent`. The bundles are excluded from the initial HTML /
// hydration payload so the browser can paint the LCP hero image before
// parsing and evaluating below-fold JavaScript on a throttled mobile CPU.
import dynamic from "next/dynamic"

const HomepageMidFold = dynamic(
  () => import("@/components/homepage-mid-fold").then(m => ({ default: m.HomepageMidFold })),
  { ssr: false, loading: () => <MidFoldSkeleton /> }
)

const HomepageFeaturedVehicles = dynamic(
  () => import("@/components/homepage-featured-vehicles").then(m => ({ default: m.HomepageFeaturedVehicles })),
  { ssr: false, loading: () => <FeaturedVehiclesSkeleton /> }
)

const HomepageBelowFold = dynamic(
  () => import("@/components/homepage-below-fold").then(m => ({ default: m.HomepageBelowFold })),
  { ssr: false, loading: () => <BelowFoldSkeleton /> }
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

type HomepageBelowFoldSectionsProps = {
  siteSettings: {
    dealerName: string
    phone: string
    streetAddress: string
    city: string
    province: string
  }
  ratingValue: number
  lowestRate: number
  weekdayHours?: { open: string; close: string } | null
  saturdayHours?: { open: string; close: string } | null
}

export function HomepageBelowFoldSections({
  siteSettings,
  ratingValue,
  lowestRate,
  weekdayHours,
  saturdayHours,
}: HomepageBelowFoldSectionsProps) {
  return (
    <>
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
    </>
  )
}
