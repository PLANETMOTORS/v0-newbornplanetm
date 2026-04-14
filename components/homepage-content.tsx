// Planet Motors Homepage — Redesign v2 (Clutch.ca + Carvana inspired)
// Section Order: Promo Banner -> Hero w/ Search -> Body Style Carousel -> 4-Step Process
//   -> Featured Vehicles -> Why Choose Us (Comparison Table) -> Sell/Trade -> Reviews
//   -> Protection Plans -> CTA -> As Featured In -> Footer
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, Shield, RotateCw, Car, CheckCircle, Star, BadgeCheck, Clock, Zap, Phone, MapPin, Award, DollarSign, Truck, Users, Leaf, Search, CreditCard, FileCheck, Home, ChevronRight, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomepageFeaturedVehicles } from "@/components/homepage-featured-vehicles"
import { VehicleShowcase } from "@/components/vehicle-showcase"


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
}

// Body style browsing — Carvana-style visual tiles
const bodyStyles = [
  { label: "SUVs", href: "/inventory?bodyType=SUV", icon: Car },
  { label: "Sedans", href: "/inventory?bodyType=Sedan", icon: Car },
  { label: "Trucks", href: "/inventory?bodyType=Truck", icon: Truck },
  { label: "Electric", href: "/inventory?fuelType=Electric", icon: Zap },
  { label: "Hybrids", href: "/inventory?fuelType=Hybrid", icon: Leaf },
  { label: "Luxury", href: "/inventory?category=Luxury", icon: Star },
  { label: "Under $30K", href: "/inventory?maxPrice=30000", icon: DollarSign },
  { label: "Family", href: "/inventory?category=Family", icon: Users },
]

// 4-Step Process
const processSteps = [
  {
    icon: Search,
    color: "bg-blue-500",
    title: "Browse & Select",
    description: "Explore our inventory with detailed photos, Carfax reports, and 360° views.",
    features: ["360° Interactive Viewer", "Full Carfax History", "210-Point Inspection Report", "Price Match Guarantee"],
  },
  {
    icon: CreditCard,
    color: "bg-green-500",
    title: "Get Pre-Approved",
    description: "Apply for financing in minutes with 20+ lending partners.",
    features: ["Soft Credit Check", "No Credit Impact", "Rates from 4.99%", "Instant Decision"],
  },
  {
    icon: FileCheck,
    color: "bg-purple-500",
    title: "Complete Purchase",
    description: "Finalize online or in-person. We handle all the paperwork.",
    features: ["Digital Paperwork", "Flexible Payments", "Tax & Licensing Included", "Warranty Options"],
  },
  {
    icon: Home,
    color: "bg-orange-500",
    title: "Delivery or Pickup",
    description: "Free home delivery across Ontario or pick up from our showroom.",
    features: ["Free Home Delivery", "Ontario-Wide Coverage", "10-Day Returns", "Next-Day Pickup"],
  },
]

const protectionPlans = [
  {
    name: "Basic Coverage",
    price: "29",
    period: "/month",
    description: "Essential protection for peace of mind",
    features: [
      "Powertrain coverage",
      "24/7 roadside assistance",
      "Trip interruption coverage",
      "Rental car reimbursement",
    ],
    highlighted: false,
  },
  {
    name: "Premium Coverage",
    price: "59",
    period: "/month",
    description: "Comprehensive protection for your vehicle",
    features: [
      "Everything in Basic",
      "Electrical system coverage",
      "Air conditioning coverage",
      "Suspension coverage",
      "Brake system coverage",
    ],
    highlighted: true,
  },
  {
    name: "Ultimate Coverage",
    price: "99",
    period: "/month",
    description: "Complete bumper-to-bumper protection",
    features: [
      "Everything in Premium",
      "Full mechanical coverage",
      "Electronics & technology",
      "Interior components",
      "Appearance protection",
      "Zero deductible option",
    ],
    highlighted: false,
  },
]

// Popular models for footer SEO links (Clutch-style)
const popularModels = [
  { name: "Honda Civic", href: "/inventory?make=Honda&model=Civic" },
  { name: "Toyota Corolla", href: "/inventory?make=Toyota&model=Corolla" },
  { name: "Toyota RAV4", href: "/inventory?make=Toyota&model=RAV4" },
  { name: "Honda CR-V", href: "/inventory?make=Honda&model=CR-V" },
  { name: "Tesla Model 3", href: "/inventory?make=Tesla&model=Model+3" },
  { name: "Hyundai Tucson", href: "/inventory?make=Hyundai&model=Tucson" },
  { name: "Mazda CX-5", href: "/inventory?make=Mazda&model=CX-5" },
  { name: "BMW X3", href: "/inventory?make=BMW&model=X3" },
]



export function HomepageContent({ siteSettings, testimonials }: HomepageProps) {
  const router = useRouter()
  const [heroSearch, setHeroSearch] = useState("")
  const [promoBannerVisible, setPromoBannerVisible] = useState(true)

  // Use Sanity testimonials or fallback to default
  const displayReviews = testimonials.length > 0 ? testimonials.slice(0, 3).map(t => ({
    name: t.customerName,
    location: t.location || "Ontario",
    rating: t.rating,
    text: t.review,
    date: t.publishedAt ? new Date(t.publishedAt).toLocaleDateString() : "Recently",
  })) : [
    { name: "Michael T.", location: "Toronto, ON", rating: 5, text: "Best car buying experience ever. The 360 viewer helped me decide before visiting. Staff was incredibly helpful!", date: "2 weeks ago" },
    { name: "Sarah L.", location: "Markham, ON", rating: 5, text: "Transparent pricing, no hidden fees. The 210-point inspection report gave me complete confidence in my purchase.", date: "1 month ago" },
    { name: "David K.", location: "Richmond Hill, ON", rating: 5, text: "Got pre-approved with TD in minutes. Great rates and the whole process was seamless. Highly recommend!", date: "3 weeks ago" },
  ]

  const ratingValue = siteSettings.aggregateRating?.ratingValue || 4.8
  const lowestRate = siteSettings.financingDefaults?.annualInterestRate || 6.29
  const weekdayHours = siteSettings.businessHours?.find(h => h.day === "Monday")
  const saturdayHours = siteSettings.businessHours?.find(h => h.day === "Saturday")

  // Quick Estimate form state
  const [estimateVehicle, setEstimateVehicle] = useState("")
  const [estimateMileage, setEstimateMileage] = useState("")
  const [estimateEmail, setEstimateEmail] = useState("")

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (heroSearch.trim()) {
      router.push(`/inventory?search=${encodeURIComponent(heroSearch.trim())}`)
    }
  }

  const handleQuickEstimate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!estimateVehicle.trim()) return
    // Navigate to trade-in page — the user will fill full details there
    const params = new URLSearchParams()
    if (estimateVehicle.trim()) params.set("vehicle", estimateVehicle.trim())
    if (estimateMileage.trim()) params.set("mileage", estimateMileage.trim())
    if (estimateEmail.trim()) params.set("email", estimateEmail.trim())
    router.push(`/trade-in?${params.toString()}`)
  }

  return (
    <main id="main-content" role="main" aria-label="Home page content" className="overflow-x-hidden max-w-full">

      {/* ═══════ PROMO ANNOUNCEMENT BANNER ═══════ */}
      {promoBannerVisible && (
        <div className="relative bg-[#1e3a8a] text-white">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-yellow-300 flex-shrink-0" />
            <span className="font-medium">Spring Sale:</span>
            <span>0% financing on select vehicles + free Ontario-wide delivery</span>
            <Link href="/inventory" className="ml-2 underline underline-offset-2 font-semibold hover:text-yellow-200 transition-colors">
              Shop Now
            </Link>
            <button
              onClick={() => setPromoBannerVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ HERO SECTION — Carvana-style with search ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af]">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text + Search */}
            <div className="text-center lg:text-left">
              {/* Trust badges row */}
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                  <BadgeCheck className="w-3.5 h-3.5 text-green-400" /> OMVIC Licensed
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                  <Star className="w-3.5 h-3.5 text-yellow-400" /> {ratingValue}/5 Rating
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Right Car.{" "}
                <span className="text-[#dc2626]">Right Price.</span>
                <span className="block text-2xl md:text-3xl lg:text-4xl mt-2 font-normal text-white/80">
                  Delivered to Your Door.
                </span>
              </h1>

              <p className="mt-6 text-lg text-white/70 max-w-lg mx-auto lg:mx-0">
                Ontario&apos;s trusted destination for quality pre-owned vehicles. 210-point inspected, 10-day returns, and financing from {lowestRate}% APR.
              </p>

              {/* Hero Search Bar */}
              <form onSubmit={handleHeroSearch} className="mt-8 max-w-xl mx-auto lg:mx-0">
                <div className="relative flex">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Search by make, model, or keyword..."
                      className="w-full pl-12 pr-4 py-4 rounded-l-xl text-gray-900 bg-white text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#dc2626] border-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-r-xl transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
                {/* Quick links */}
                <div className="mt-3 flex flex-wrap gap-2 justify-center lg:justify-start">
                  {["SUVs", "Electric", "Under $30K", "Trucks"].map((tag) => (
                    <Link
                      key={tag}
                      href={`/inventory?search=${encodeURIComponent(tag)}`}
                      className="text-xs bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </form>
            </div>

            {/* Hero Right: Vehicle Showcase */}
            <div className="relative">
              <VehicleShowcase />
              <div className="absolute top-4 right-4 bg-[#dc2626] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg z-10 animate-pulse">
                🔥 Spring Sale
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Shield, text: "210-Point Inspection" },
              { icon: RotateCw, text: "10-Day Money Back" },
              { icon: Truck, text: "Free Ontario Delivery" },
              { icon: Award, text: "Price Match Guarantee" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 text-white/70 text-sm">
                <Icon className="w-5 h-5 text-white/50" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BROWSE BY TYPE — Carvana style tiles ═══════ */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse by Type</h2>
            <Link href="/inventory" className="text-[#1e3a8a] hover:text-[#dc2626] font-medium text-sm flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {bodyStyles.map((style) => (
              <Link
                key={style.label}
                href={style.href}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-[#1e3a8a] hover:shadow-md bg-gray-50 hover:bg-blue-50/50 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center group-hover:bg-[#1e3a8a]/10 transition-colors shadow-sm">
                  <style.icon className="w-6 h-6 text-[#1e3a8a]" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#1e3a8a] transition-colors">{style.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 4-STEP PROCESS ═══════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-[#1e3a8a] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" /> Simple 4-Step Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Buy Your Car 100% Online</h2>
            <p className="mt-4 text-gray-600 text-lg">Complete your entire purchase from home in under 30 minutes.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div key={step.title} className="relative">
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                )}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 relative z-10 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Step {index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" /> Backed by our 10-Day Money-Back Guarantee
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button size="lg" className="bg-[#1e3a8a] hover:bg-[#172554] text-white px-8" asChild>
              <Link href="/inventory">Start Shopping <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
              <Link href="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED VEHICLES ═══════ */}
      <HomepageFeaturedVehicles />

      {/* ═══════ WHY CHOOSE US — Clutch-style comparison table ═══════ */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Choose {siteSettings.dealerName}?</h2>
            <p className="text-gray-600 mt-3 text-lg">See how we compare to other dealers</p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 pr-4 text-sm font-medium text-gray-500 w-1/3">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <span className="inline-block bg-[#1e3a8a] text-white px-4 py-1.5 rounded-full text-sm font-bold">Planet Motors</span>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-gray-500">Traditional Dealer</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-gray-500">Private Sale</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: "210-Point Inspection", us: true, dealer: "Varies", priv: false },
                  { feature: "10-Day Money Back", us: true, dealer: false, priv: false },
                  { feature: "Free Ontario Delivery", us: true, dealer: false, priv: false },
                  { feature: "Carfax Report Included", us: true, dealer: "Extra Cost", priv: false },
                  { feature: "EV Battery Certification", us: true, dealer: false, priv: false },
                  { feature: "No-Haggle Pricing", us: true, dealer: false, priv: false },
                  { feature: "Multi-Lender Financing", us: true, dealer: "Limited", priv: false },
                  { feature: "Online Purchase Option", us: true, dealer: "Partial", priv: false },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3.5 pr-4 font-medium text-gray-700">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.us === true ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-gray-400">{String(row.us)}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.dealer === true ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : row.dealer === false ? <X className="w-5 h-5 text-gray-300 mx-auto" /> : <span className="text-gray-400 text-xs">{row.dealer}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.priv === true ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════ SELL OR TRADE — Carvana-style CTA ═══════ */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <DollarSign className="w-4 h-4" /> Sell or Trade
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Have a Vehicle to Sell or Trade?</h2>
              <p className="text-gray-600 text-lg mb-6">
                Get a competitive offer in minutes. We buy all makes and models — you don&apos;t need to purchase from us to sell to us.
              </p>
              <ul className="space-y-3 mb-8">
                {["Instant online offer", "Free vehicle pickup", "Same-day payment available", "No obligation to buy from us"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                <Link href="/trade-in">Get My Offer <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
            <form onSubmit={handleQuickEstimate} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Estimate</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Year, Make, Model (e.g. 2021 Honda Civic)"
                  value={estimateVehicle}
                  onChange={(e) => setEstimateVehicle(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Mileage (km)"
                  value={estimateMileage}
                  onChange={(e) => setEstimateMileage(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
                <input
                  type="email"
                  placeholder="Your Email (optional)"
                  value={estimateEmail}
                  onChange={(e) => setEstimateEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
                <Button type="submit" className="w-full bg-[#1e3a8a] hover:bg-[#172554]">
                  Get Instant Offer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════ CUSTOMER REVIEWS ═══════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex">{[1,2,3,4,5].map((s) => <Star key={s} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div>
              <span className="text-gray-600">{ratingValue}/5 Star Rating</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}
                </div>
                <p className="text-gray-700 mb-4">&quot;{review.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{review.name}</p>
                    <p className="text-sm text-gray-500">{review.location}</p>
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PROTECTION PLANS ═══════ */}
      <section id="protection-plans" className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white">Protection Plans</h2>
            <p className="mt-3 text-gray-400">Choose the coverage that fits your needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {protectionPlans.map((plan) => (
              <div key={plan.name} className={`rounded-xl p-8 ${plan.highlighted ? "bg-white text-gray-900 ring-2 ring-[#dc2626] scale-105" : "bg-white/5 text-white border border-white/10"}`}>
                {plan.highlighted && <span className="inline-block bg-[#dc2626] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Most Popular</span>}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-400"}`}>{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-[#1e3a8a]" : "text-green-400"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-8 ${plan.highlighted ? "bg-[#1e3a8a] text-white hover:bg-[#172554]" : "bg-white text-[#0f172a] hover:bg-gray-100"}`} asChild>
                  <Link href={`/protection-plans#${plan.name.toLowerCase().replace(" ", "-")}`}>Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-16 bg-[#1e3a8a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Ready to find your perfect vehicle?</h2>
              <p className="mt-4 text-white/80 max-w-xl">
                Browse our inventory of certified pre-owned vehicles. Financing from {lowestRate}% APR.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white" asChild>
                  <Link href="/inventory">Browse Inventory <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/financing">Get Pre-Approved</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-6">
                <Phone className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Call Us</h3>
                <p className="text-sm text-white/80 mt-1">{siteSettings.phone}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <MapPin className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Visit Us</h3>
                <p className="text-sm text-white/80 mt-1">{siteSettings.streetAddress}</p>
                <p className="text-sm text-white/80">{siteSettings.city}, {siteSettings.province?.slice(0, 2)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <Clock className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Hours</h3>
                <p className="text-sm text-white/80 mt-1">Mon-Fri: {weekdayHours?.open ?? "9AM"}-{weekdayHours?.close ?? "7PM"}</p>
                <p className="text-sm text-white/80">Sat: {saturdayHours?.open ?? "10AM"}-{saturdayHours?.close ?? "5PM"}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <BadgeCheck className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Licensed</h3>
                <p className="text-sm text-white/80 mt-1">OMVIC Registered</p>
                <p className="text-sm text-white/80">Ontario Dealer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ POPULAR MODELS — SEO footer (Clutch-style) ═══════ */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Popular Models</h3>
          <div className="flex flex-wrap gap-2">
            {popularModels.map((m) => (
              <Link key={m.name} href={m.href} className="text-sm text-[#1e3a8a] hover:text-[#dc2626] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:shadow-sm transition-all">
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
