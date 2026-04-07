"use client"

// Planet Motors Homepage Content - Trust-First Design (Clutch/Carvana Style)
// Section Order: Hero -> 4-Step Process -> Featured Vehicles -> Why Choose Us -> Sell/Trade -> Reviews -> Protection Plans -> CTA -> The Promise -> Footer
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Shield, RotateCw, Car, CheckCircle, Star, BadgeCheck, Clock, Zap, Battery, Phone, MapPin, Award, DollarSign, Truck, Users, Leaf, Search, CreditCard, FileCheck, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleShowcase } from "@/components/vehicle-showcase"
import { TrustBadges } from "@/components/trust-badges"

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

// Trust bar items
const trustBarItems = [
  { icon: RotateCw, label: "10-Day Returns" },
  { icon: CheckCircle, label: "210-Point Inspection" },
  { icon: Shield, label: "No Hidden Fees" },
  { icon: Truck, label: "Ontario-Wide Delivery" },
]

// Shop by category chips
const shopByCategories = [
  { icon: DollarSign, label: "Under $30k", href: "/inventory?maxPrice=30000" },
  { icon: Car, label: "SUVs", href: "/inventory?bodyType=SUV" },
  { icon: Zap, label: "Electric", href: "/inventory?fuelType=Electric" },
  { icon: Leaf, label: "Hybrids", href: "/inventory?fuelType=Hybrid" },
  { icon: Star, label: "Luxury", href: "/inventory?category=Luxury" },
  { icon: Users, label: "Family", href: "/inventory?category=Family" },
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

// Featured vehicles data (mock - replace with real data)
const featuredVehicles = [
  {
    id: "1",
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    price: 42900,
    monthlyPayment: 399,
    mileage: "358 km range",
    image: "/placeholder-car.jpg",
    badge: "Popular",
    isEV: true,
    isAvilooCertified: true,
  },
  {
    id: "2",
    year: 2024,
    make: "Toyota",
    model: "RAV4 Hybrid",
    price: 38500,
    monthlyPayment: 349,
    mileage: "41 MPG",
    image: "/placeholder-car.jpg",
    badge: "Fuel Saver",
    isEV: false,
    isAvilooCertified: false,
  },
  {
    id: "3",
    year: 2024,
    make: "Hyundai",
    model: "Ioniq 5",
    price: 48500,
    monthlyPayment: 449,
    mileage: "488 km range",
    image: "/placeholder-car.jpg",
    badge: "New Arrival",
    isEV: true,
    isAvilooCertified: true,
  },
  {
    id: "4",
    year: 2023,
    make: "Honda",
    model: "CR-V",
    price: 34900,
    monthlyPayment: 319,
    mileage: "30 MPG",
    image: "/placeholder-car.jpg",
    badge: "Popular",
    isEV: false,
    isAvilooCertified: false,
  },
  {
    id: "5",
    year: 2023,
    make: "Ford",
    model: "Mustang Mach-E",
    price: 52900,
    monthlyPayment: 489,
    mileage: "402 km range",
    image: "/placeholder-car.jpg",
    badge: "Premium",
    isEV: true,
    isAvilooCertified: true,
  },
  {
    id: "6",
    year: 2022,
    make: "BMW",
    model: "X3",
    price: 44900,
    monthlyPayment: 419,
    mileage: "26 MPG",
    image: "/placeholder-car.jpg",
    badge: "Luxury",
    isEV: false,
    isAvilooCertified: false,
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

// The Promise items (Box 10)
const promiseItems = [
  { icon: CheckCircle, title: "210-Point Inspection", description: "Every vehicle thoroughly checked" },
  { icon: RotateCw, title: "10-Day Returns", description: "No questions asked" },
  { icon: Truck, title: "Free Ontario Delivery", description: "Right to your door" },
  { icon: Shield, title: "Warranty Included", description: "Comprehensive coverage" },
  { icon: BadgeCheck, title: "Carfax Verified", description: "Full history report" },
  { icon: Phone, title: "24/7 Support", description: "We're here for you" },
]

export function HomepageContent({ siteSettings, testimonials }: HomepageProps) {
  const [activeTab, setActiveTab] = useState<"all" | "electric" | "suvs">("all")

  // Filter vehicles based on active tab
  const filteredVehicles = featuredVehicles.filter(v => {
    if (activeTab === "electric") return v.isEV
    if (activeTab === "suvs") return v.model.includes("CR-V") || v.model.includes("X3") || v.model.includes("RAV4")
    return true
  })

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
  const reviewCount = siteSettings.aggregateRating?.reviewCount || 500
  const lowestRate = siteSettings.financingDefaults?.annualInterestRate || 6.29

  // Get business hours for display
  const weekdayHours = siteSettings.businessHours?.find(h => h.day === "Monday")
  const saturdayHours = siteSettings.businessHours?.find(h => h.day === "Saturday")

  return (
    <main id="main-content" role="main" aria-label="Home page content">
      {/* Trust Bar - White Background */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {trustBarItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-gray-600">
                <item.icon className="w-4 h-4 text-[#1e3a8a]" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== BOX 2: HERO SECTION - Off-White #F9FAFB ========== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm mb-6 shadow-sm border border-gray-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 font-medium">50+ Vehicles In Stock</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                The Smarter Way to
                <span className="block text-[#1e3a8a]">
                  Buy or Sell Your Car
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                Ontario&apos;s trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-8" asChild>
                  <Link href="/inventory">
                    Browse Inventory
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white px-8" asChild>
                  <Link href="/trade-in">
                    Sell / Trade Your Car
                  </Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-10 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#1e3a8a]">500+</div>
                  <div className="text-sm text-gray-500">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#1e3a8a]">20+</div>
                  <div className="text-sm text-gray-500">Lender Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#1e3a8a]">4.9</div>
                  <div className="text-sm text-gray-500">Google Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image / Vehicle Showcase */}
            <div className="relative">
              <VehicleShowcase />
              
              {/* Floating Price Tag */}
              <div className="absolute -bottom-4 left-4 bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100">
                <div className="text-xs text-gray-500">Financing from</div>
                <div className="text-xl font-bold text-[#1e3a8a]">$299/mo</div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-2 right-4 bg-[#dc2626] text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                Low Rates Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category - stays between Hero and Process */}
      <section className="py-6 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">Shop by:</span>
            {shopByCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
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
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                )}
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6 relative z-10 h-full hover:shadow-lg transition-shadow">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Step {index + 1}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                  
                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
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
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
              <Link href="/how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== BOX 3: FEATURED VEHICLES - Pure White #FFFFFF ========== */}
      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1e3a8a]">Featured Vehicles</h2>
              <p className="text-gray-600 mt-1">Quality vehicles ready for delivery</p>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: "all", label: "All" },
                { key: "electric", label: "Electric" },
                { key: "suvs", label: "SUVs" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as "all" | "electric" | "suvs")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#1e3a8a] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      vehicle.badge === "Popular" ? "bg-[#1e3a8a] text-white" :
                      vehicle.badge === "Fuel Saver" ? "bg-green-600 text-white" :
                      vehicle.badge === "New Arrival" ? "bg-orange-500 text-white" :
                      vehicle.badge === "Premium" ? "bg-purple-600 text-white" :
                      vehicle.badge === "Luxury" ? "bg-amber-600 text-white" :
                      "bg-gray-600 text-white"
                    }`}>
                      {vehicle.badge}
                    </span>
                  </div>
                  
                  {/* Aviloo Certified Badge */}
                  {vehicle.isAvilooCertified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-green-700">
                      <Battery className="w-3 h-3" />
                      Aviloo Certified
                    </div>
                  )}

                  {/* Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.isEV && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" />
                        EV
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{vehicle.mileage}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="text-xl font-bold text-[#1e3a8a]">
                        ${vehicle.price.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        or <span className="font-bold">${vehicle.monthlyPayment}/mo</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-[#1e3a8a] hover:bg-[#172554]" asChild>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white" asChild>
              <Link href="/inventory">
                View All Inventory
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== BOX 4: WHY CHOOSE US - Very Light Grey #F3F4F6 ========== */}
      <section className="py-16" style={{ backgroundColor: "#F3F4F6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose {siteSettings.dealerName}?</h2>
            <p className="text-gray-600 mt-3">Industry-leading standards that set us apart</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: CheckCircle,
                title: "210-Point Inspection",
                description: "Every vehicle passes our comprehensive inspection with full transparency reports.",
              },
              {
                icon: Battery,
                title: "EV Battery Health",
                description: "Exclusive Aviloo battery certification for EVs - know exactly what you're getting.",
              },
              {
                icon: RotateCw,
                title: "10-Day Returns",
                description: "Not satisfied? Return your vehicle within 10 days, no questions asked.",
              },
              {
                icon: Truck,
                title: "Ontario-Wide Delivery",
                description: "Get your vehicle delivered anywhere in Ontario with our convenient delivery service.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl bg-white hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-[#1e3a8a]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOX 5: SELL OR TRADE - Soft Mint #E6FFFA ========== */}
      <section className="py-16" style={{ backgroundColor: "#E6FFFA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <DollarSign className="w-4 h-4" />
                Sell or Trade
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Have a Vehicle to Sell or Trade?
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Get a competitive offer in minutes. We buy all makes and models - you don&apos;t need to purchase from us to sell to us.
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
                <Link href="/trade-in">
                  Get My Offer
                </Link>
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Estimate</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Year, Make, Model" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" 
                />
                <input 
                  type="text" 
                  placeholder="Mileage (km)" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" 
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" 
                />
                <Button className="w-full bg-[#1e3a8a] hover:bg-[#172554]">
                  Get Instant Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BOX 6: CUSTOMER REVIEWS - Pure White #FFFFFF ========== */}
      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-600">{ratingValue}/5 from {reviewCount}+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                    />
                  ))}
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

      {/* ========== BOX 7: PROTECTION PLANS - Deep Navy #1A202C ========== */}
      <section id="protection-plans" className="py-16" style={{ backgroundColor: "#1A202C" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white">Protection Plans</h2>
            <p className="mt-3 text-gray-400">
              Choose the coverage that fits your needs. All plans include our satisfaction guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {protectionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 ${
                  plan.highlighted
                    ? "bg-white text-gray-900 ring-2 ring-white ring-offset-2 ring-offset-[#1A202C]"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-400"}`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-[#1e3a8a]" : "text-green-400"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-8 ${plan.highlighted ? "bg-[#1e3a8a] text-white hover:bg-[#172554]" : "bg-white text-[#1A202C] hover:bg-gray-100"}`}
                  asChild
                >
                  <Link href={`/protection-plans#${plan.name.toLowerCase().replace(" ", "-")}`}>
                    Get Started
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOX 8: FINAL CTA - Brand Blue #2B6CB0 ========== */}
      <section className="py-16" style={{ backgroundColor: "#2B6CB0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Ready to find your perfect vehicle?
              </h2>
              <p className="mt-4 text-white/80 max-w-xl">
                Browse our inventory of certified pre-owned vehicles. Get pre-approved for financing in minutes with rates from {lowestRate}% APR.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-[#2B6CB0] hover:bg-gray-100" asChild>
                  <Link href="/inventory">
                    Browse Inventory
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/financing">
                    Get Pre-Approved
                  </Link>
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
                <p className="text-sm text-white/80 mt-1">
                  Mon-Fri: {weekdayHours?.open || "9AM"}-{weekdayHours?.close || "7PM"}
                </p>
                <p className="text-sm text-white/80">
                  Sat: {saturdayHours?.open || "10AM"}-{saturdayHours?.close || "5PM"}
                </p>
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

      {/* ========== BOX 10: THE PROMISE - Very Light Grey #F3F4F6 ========== */}
      <section className="py-16" style={{ backgroundColor: "#F3F4F6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-medium text-[#1e3a8a] mb-2">Why Customers Trust Us</p>
            <h2 className="text-3xl font-bold text-gray-900">The {siteSettings.dealerName} Promise</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {promiseItems.map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 mx-auto bg-[#1e3a8a] rounded-xl flex items-center justify-center mb-3">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges (OMVIC, etc.) */}
      <TrustBadges />
    </main>
  )
}
