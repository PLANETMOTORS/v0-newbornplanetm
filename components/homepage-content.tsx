"use client"

// Planet Motors Homepage Content - Trust-First Design (Clutch/Carvana Style)
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Shield, RotateCw, Car, CheckCircle, Star, BadgeCheck, Clock, Zap, Battery, Phone, MapPin, TrendingUp, Award, Sparkles, DollarSign, Truck, Users, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VehicleShowcase } from "@/components/vehicle-showcase"
import { HowItWorks } from "@/components/how-it-works"
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
  { icon: Truck, label: "Free Delivery" },
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
      {/* Trust Bar */}
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

      {/* Hero Section - Light Background (Clutch/Carvana Style) */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm mb-6 shadow-sm border border-gray-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 font-medium">50+ Vehicles In Stock</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Buy Your Next Vehicle
                <span className="block text-[#1e3a8a]">
                  With Confidence
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                Ontario&apos;s trusted online dealership specializing in EVs, hybrids, and quality used vehicles. Browse, finance, and get your car delivered.
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

      {/* Shop By Category */}
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

      {/* Featured Vehicles Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1e3a8a]">Featured Vehicles</h2>
              <p className="text-gray-600 mt-1">Quality vehicles ready for delivery</p>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
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
                      : "text-gray-600 hover:bg-gray-100"
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
                      <div className="text-sm text-gray-500">
                        or ${vehicle.monthlyPayment}/mo
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

      {/* Why Planet Motors Section */}
      <section className="py-16 bg-white">
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
                title: "Free Delivery",
                description: "Get your vehicle delivered anywhere in Ontario at no extra cost.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
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

      {/* Sell/Trade Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-y border-green-100">
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
                  Get Your Offer
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

      {/* Reviews Section */}
      <section className="py-16 bg-white">
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

      {/* Protection Plans Section */}
      <section id="protection-plans" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Protection Plans</h2>
            <p className="mt-3 text-gray-600">
              Choose the coverage that fits your needs. All plans include our satisfaction guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {protectionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border ${
                  plan.highlighted
                    ? "bg-[#1e3a8a] text-white border-[#1e3a8a] ring-2 ring-[#1e3a8a] ring-offset-2"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/80" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-gray-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-[#1e3a8a]"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-8 ${plan.highlighted ? "bg-white text-[#1e3a8a] hover:bg-gray-100" : "bg-[#1e3a8a] text-white hover:bg-[#172554]"}`}
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

      {/* CTA Section */}
      <section className="py-16 bg-[#1e3a8a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold">
                Ready to find your perfect vehicle?
              </h2>
              <p className="mt-4 text-white/80 max-w-xl">
                Browse our inventory of certified pre-owned vehicles. Get pre-approved for financing in minutes with rates from {lowestRate}% APR.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-[#1e3a8a] hover:bg-gray-100" asChild>
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
                <Phone className="w-8 h-8 mb-4" />
                <h3 className="font-semibold">Call Us</h3>
                <p className="text-sm text-white/80 mt-1">{siteSettings.phone}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <MapPin className="w-8 h-8 mb-4" />
                <h3 className="font-semibold">Visit Us</h3>
                <p className="text-sm text-white/80 mt-1">{siteSettings.streetAddress}</p>
                <p className="text-sm text-white/80">{siteSettings.city}, {siteSettings.province?.slice(0, 2)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <Clock className="w-8 h-8 mb-4" />
                <h3 className="font-semibold">Hours</h3>
                <p className="text-sm text-white/80 mt-1">
                  Mon-Fri: {weekdayHours?.open || "9AM"}-{weekdayHours?.close || "7PM"}
                </p>
                <p className="text-sm text-white/80">
                  Sat: {saturdayHours?.open || "10AM"}-{saturdayHours?.close || "5PM"}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <BadgeCheck className="w-8 h-8 mb-4" />
                <h3 className="font-semibold">Licensed</h3>
                <p className="text-sm text-white/80 mt-1">OMVIC Registered</p>
                <p className="text-sm text-white/80">Ontario Dealer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <TrustBadges />
    </main>
  )
}
