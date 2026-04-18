// Planet Motors Homepage Content - Trust-First Design (Clutch/Carvana Style)
// Section Order: Hero -> 4-Step Process -> Featured Vehicles -> Why Choose Us -> Sell/Trade -> Reviews -> Protection Plans -> CTA -> The Promise -> Footer
import { Suspense } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight, Shield, Car, CheckCircle, Star, Zap, Award, DollarSign, Users, Leaf, Search, CreditCard, FileCheck, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

// Code-split heavy below-fold sections into separate chunks
const HomepageFeaturedVehicles = dynamic(
  () => import("@/components/homepage-featured-vehicles").then(m => ({ default: m.HomepageFeaturedVehicles })),
  { loading: () => <FeaturedVehiclesSkeleton /> }
)

// Lazy-load below-fold sections to reduce initial JS bundle
const HomepageBelowFold = dynamic(
  () => import("@/components/homepage-below-fold").then(m => ({ default: m.HomepageBelowFold })),
  { ssr: true }
)

// VehicleShowcase is the above-fold hero (LCP element) — static import
// so the browser downloads its JS immediately instead of waiting for
// a dynamic chunk to load first.
import { VehicleShowcase } from "@/components/vehicle-showcase"

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
  testimonials: Array<{
    _id: string
    customerName: string
    rating: number
    review: string
    location?: string
    vehiclePurchased?: string
    publishedAt?: string
  }>
  faqs: Array<{
    _id: string
    question: string
    answer: string
  }>
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



// Shop by category chips
const shopByCategories = [
  { icon: DollarSign, label: "Under $30k", href: "/inventory?maxPrice=30000", iconColor: "text-green-700" },
  { icon: Car, label: "SUVs", href: "/inventory?bodyType=SUV", iconColor: "text-slate-600" },
  { icon: Zap, label: "Electric", href: "/inventory?fuelType=Electric", iconColor: "text-emerald-500" },
  { icon: Leaf, label: "Hybrids", href: "/inventory?fuelType=Hybrid", iconColor: "text-teal-500" },
  { icon: Star, label: "Luxury", href: "/inventory?category=Luxury", iconColor: "text-amber-500" },
  { icon: Users, label: "Family", href: "/inventory?category=Family", iconColor: "text-blue-500" },
]

// 4-Step Process (Box 9) - with colorful icons
const processSteps = [
  {
    icon: Search,
    color: "bg-blue-500",
    title: "Browse & Select",
    description: "Explore our inventory of quality pre-owned vehicles with detailed photos, Carfax reports, and 360° views.",
    features: ["360° Interactive Viewer", "Full Carfax History", "210-Point Inspection Report", "Price Match Guarantee"],
  },
  {
    icon: CreditCard,
    color: "bg-green-500",
    title: "Get Pre-Approved",
    description: "Apply for financing in minutes with 20+ lending partners. Get competitive rates without affecting your credit.",
    features: ["Soft Credit Check", "No Credit Impact", "Rates from 4.99%", "Instant Decision"],
  },
  {
    icon: FileCheck,
    color: "bg-purple-500",
    title: "Complete Purchase",
    description: "Finalize your purchase online or in-person. We handle all the paperwork including licensing, taxes, and warranty options.",
    features: ["Digital Paperwork", "Flexible Payments", "Tax & Licensing Included", "Warranty Options"],
  },
  {
    icon: Home,
    color: "bg-orange-500",
    title: "Delivery or Pickup",
    description: "Choose free home delivery anywhere in Ontario or pick up from our Richmond Hill showroom at your convenience.",
    features: ["Free Home Delivery", "Ontario-Wide Coverage", "10-Day Returns", "Next-Day Pickup"],
  },
]





export function HomepageContent({ siteSettings, testimonials, showcaseVehicles }: HomepageProps) {
  // Use Sanity testimonials or fallback to default
  const displayReviews = testimonials.length > 0 ? testimonials.slice(0, 3).map(t => ({
    name: t.customerName,
    location: t.location || "Ontario",
    rating: t.rating,
    text: t.review,
    date: t.publishedAt ? new Date(t.publishedAt).toLocaleDateString() : "Recently",
  })) : [
    {
      name: "Michael T.",
      location: "Toronto, ON",
      rating: 5,
      text: "Best car buying experience ever. The 360 viewer helped me decide before visiting. Staff was incredibly helpful!",
      date: "2 weeks ago",
    },
    {
      name: "Sarah L.",
      location: "Markham, ON",
      rating: 5,
      text: "Transparent pricing, no hidden fees. The 210-point inspection report gave me complete confidence in my purchase.",
      date: "1 month ago",
    },
    {
      name: "David K.",
      location: "Richmond Hill, ON",
      rating: 5,
      text: "Got pre-approved with TD in minutes. Great rates and the whole process was seamless. Highly recommend!",
      date: "3 weeks ago",
    },
  ]

  const ratingValue = siteSettings.aggregateRating?.ratingValue || 4.8
  const lowestRate = siteSettings.financingDefaults?.annualInterestRate || 6.29

  // Get business hours for display
  const weekdayHours = siteSettings.businessHours?.find(h => h.day === "Monday")
  const saturdayHours = siteSettings.businessHours?.find(h => h.day === "Saturday")

  return (
    <section id="main-content" tabIndex={-1} aria-label="Home page content" className="overflow-x-hidden max-w-full">
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

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start min-h-[3.5rem] sm:min-h-[3rem]">
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

      {/* Shop By Category - Carvana Style Large Boxes */}
      <section className="py-16 bg-white border-b border-[#dce3ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              What Are You Looking For?
            </h2>
          </div>

          {/* Grid of 6 Boxes in Single Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {shopByCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative flex flex-col items-center justify-center p-5 bg-white rounded-xl border-2 border-[#e5e7eb] hover:border-[#1e3a8a] hover:bg-[#f0f4ff] transition-all duration-200 hover:shadow-md"
              >
                {/* Popular badge for SUVs */}
                {cat.label === "SUVs" && (
                  <span className="absolute -top-2.5 -right-2 bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                {/* Icon */}
                <div className="mb-2 p-3 bg-gray-50 rounded-lg group-hover:bg-[#1e3a8a]/10 transition-colors">
                  <cat.icon className={`w-8 h-8 ${cat.iconColor}`} />
                </div>

                {/* Category Label */}
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors text-center leading-tight">
                  {cat.label}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOX 9: 4-STEP PROCESS - Pure White #FFFFFF ========== */}
      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Simple 4-Step Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Buy Your Car 100% Online
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              From browsing to delivery, complete your entire car purchase from the comfort of your home. Most customers complete the process in under 30 minutes.
            </p>
          </div>

          {/* Process Steps with Colorful Icons */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div key={step.title} className="relative">
                {/* Connector Line */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-[#dce3ed] -translate-y-1/2 z-0" />
                )}
                
                <div className="bg-white border border-[#dce3ed] rounded-2xl p-6 relative z-10 h-full hover:shadow-lg transition-shadow">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Step {index + 1}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                  
                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Money Back Guarantee Badge */}
          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Backed by our 10-Day Money-Back Guarantee
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button size="lg" className="bg-[#1e3a8a] hover:bg-[#172554] text-white px-8" asChild>
              <Link href="/inventory">
                Start Shopping
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-[#c5d0de] text-gray-700 hover:bg-[#f0f4f8]" asChild>
              <Link href="/how-it-works">
                Learn how it works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== BOX 3: FEATURED VEHICLES - Pure White #FFFFFF ========== */}
      <HomepageFeaturedVehicles />

      {/* Below-fold sections: lazy-loaded to reduce initial JS bundle */}
      <HomepageBelowFold
        siteSettings={siteSettings}
        displayReviews={displayReviews}
        ratingValue={ratingValue}
        lowestRate={lowestRate}
        weekdayHours={weekdayHours}
        saturdayHours={saturdayHours}
      />

    </section>
  )
}