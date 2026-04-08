"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  ChevronRight, Shield, RotateCcw, CheckCircle, Star, ArrowRight, Menu, Phone, MapPin, 
  Car, Zap, Battery, DollarSign, Truck, BadgeCheck, X
} from "lucide-react"

// Mockup V2: Trust-First Homepage Design for Planet Motors
// Broader positioning: "Ontario's trusted used vehicle dealership specializing in EVs"
// Brand colors: Navy Blue #1e3a8a, Red #dc2626

export default function HomepageMockupV2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const vehicles = [
    { id: 1, name: "Tesla Model 3", year: 2023, price: "$42,900", monthly: "$399/mo", range: "358 km", type: "electric", badge: "Popular", isEV: true },
    { id: 2, name: "Toyota RAV4 Hybrid", year: 2024, price: "$38,500", monthly: "$349/mo", mpg: "41 MPG", type: "suv", badge: "Fuel Saver", isEV: false },
    { id: 3, name: "Hyundai Ioniq 5", year: 2024, price: "$48,500", monthly: "$449/mo", range: "488 km", type: "electric", badge: "New Arrival", isEV: true },
    { id: 4, name: "Honda CR-V", year: 2023, price: "$34,900", monthly: "$319/mo", mpg: "30 MPG", type: "suv", badge: null, isEV: false },
    { id: 5, name: "Ford Mustang Mach-E", year: 2023, price: "$52,900", monthly: "$489/mo", range: "402 km", type: "electric", badge: "Premium", isEV: true },
    { id: 6, name: "BMW X3", year: 2022, price: "$44,900", monthly: "$419/mo", mpg: "26 MPG", type: "suv", badge: "Luxury", isEV: false },
  ]

  const filteredVehicles = activeTab === "all" 
    ? vehicles 
    : activeTab === "electric" 
      ? vehicles.filter(v => v.type === "electric")
      : vehicles.filter(v => v.type === "suv")

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar - Contact Info */}
      <div className="bg-[#1e3a8a] text-white/90 text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:+14165551234" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              (416) 555-1234
            </a>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Scarborough, ON
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Mon-Fri: 9AM-7PM | Sat: 9AM-6PM</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full font-medium">OMVIC Licensed</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Planet-Motors---Logo-Final%20Transp%20Back-lBOeordAvQp4WQW3K6p5yxuD3w9XwL.jpeg"
              alt="Planet Motors"
              width={60}
              height={60}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              Shop Cars
            </Link>
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              EVs & Hybrids
            </Link>
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              Sell / Trade
            </Link>
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              Financing
            </Link>
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              How It Works
            </Link>
            <Link href="#" className="px-4 py-2 text-gray-700 hover:text-[#1e3a8a] hover:bg-gray-50 font-medium rounded-lg transition-colors">
              Reviews
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:block px-4 py-2 text-[#1e3a8a] font-medium hover:bg-gray-50 rounded-lg transition-colors">
              Sign In
            </button>
            <button className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg transition-colors shadow-md">
              Get Pre-Approved
            </button>
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            <div className="p-4 flex justify-between items-center border-b">
              <span className="font-bold text-xl">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {["Shop Cars", "EVs & Hybrids", "Sell / Trade", "Financing", "How It Works", "Reviews"].map(item => (
                <Link key={item} href="#" className="block px-4 py-3 text-lg font-medium hover:bg-gray-50 rounded-lg">
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Trust Bar */}
        <div className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 md:gap-10 text-sm overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <RotateCcw className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-medium">10-Day Returns</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-medium">210-Point Inspection</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-medium">No Hidden Fees</span>
            </div>
            <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <Truck className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-medium">Ontario-Wide Delivery</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Light Background (Clutch/Carvana Style) */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #1e3a8a 0.5px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
                Buy Your Next Vehicle
                <span className="block text-[#1e3a8a]">
                  With Confidence
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Ontario&apos;s trusted online dealership specializing in EVs, hybrids, and quality used vehicles. Browse, finance, and get your car delivered.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group">
                  Browse Inventory
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white hover:bg-gray-50 text-[#1e3a8a] font-semibold rounded-xl transition-colors border-2 border-[#1e3a8a]">
                  Sell / Trade Your Car
                </button>
              </div>


            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="aspect-[4/3] bg-white rounded-3xl border border-gray-200 shadow-xl flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-[#1e3a8a]/30" />
                  </div>
                  <p className="text-gray-400">Featured Vehicle Image</p>
                  <p className="text-gray-300 text-sm">Tesla, SUV, or Hybrid showcase</p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-[#dc2626] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-10">
                Low Rates Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Need - Discovery Chips */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-gray-500 font-medium whitespace-nowrap">Shop by:</span>
            {[
              { label: "Under $30k", icon: DollarSign },
              { label: "SUVs", icon: Car },
              { label: "Electric", icon: Zap },
              { label: "Hybrids", icon: Battery },
              { label: "Luxury", icon: BadgeCheck },
              { label: "Family", icon: Car },
            ].map((chip, i) => (
              <button 
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-[#1e3a8a] hover:text-white rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                <chip.icon className="w-4 h-4" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Inventory with Tabs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
                Featured Vehicles
              </h2>
              <p className="text-gray-600">Quality vehicles ready for delivery</p>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "all", label: "All" },
                { id: "electric", label: "Electric" },
                { id: "suv", label: "SUVs" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? "bg-white text-[#1e3a8a] shadow-sm" 
                      : "text-gray-600 hover:text-[#1e3a8a]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.slice(0, 6).map((car) => (
              <div key={car.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#1e3a8a]/30 transition-all">
                {/* Image */}
                <div className="relative aspect-[16/10] bg-gray-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Car className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="text-gray-400 text-sm mt-2">Vehicle Image</p>
                    </div>
                  </div>
                  {car.badge && (
                    <div className={`absolute top-3 left-3 text-white text-xs font-semibold px-3 py-1 rounded-full ${
                      car.badge === "Popular" ? "bg-[#dc2626]" : 
                      car.badge === "New Arrival" ? "bg-green-500" : 
                      car.badge === "Luxury" ? "bg-purple-600" : 
                      "bg-[#1e3a8a]"
                    }`}>
                      {car.badge}
                    </div>
                  )}
                  {/* Aviloo Badge for EVs */}
                  {car.isEV && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium text-green-700">
                      <Battery className="w-3 h-3" />
                      Aviloo Certified
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-[#1e3a8a] group-hover:text-[#dc2626] transition-colors">
                        {car.year} {car.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {car.isEV ? `${car.range} range` : car.mpg}
                      </p>
                    </div>
                    {car.isEV && (
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        EV
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-2xl font-bold text-[#1e3a8a]">{car.price}</div>
                      <div className="text-sm text-gray-500">or {car.monthly}</div>
                    </div>
                    <button className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#172554] text-white text-sm font-medium rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="#" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1e3a8a] text-[#1e3a8a] font-semibold rounded-xl hover:bg-[#1e3a8a] hover:text-white transition-colors">
              View All Inventory
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Planet Motors - Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-4">
              Why Choose Planet Motors?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We&apos;re building a better way to buy cars - transparent, fair, and designed around you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: RotateCcw, title: "10-Day Returns", desc: "Not happy? Full refund, no questions asked." },
              { icon: CheckCircle, title: "210-Point Inspection", desc: "Every vehicle rigorously inspected and certified." },
              { icon: Battery, title: "Aviloo Battery Health", desc: "EV battery certified by independent experts." },
              { icon: Shield, title: "No Hidden Fees", desc: "The price you see is the price you pay." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-[#1e3a8a]/30 transition-all">
                <div className="w-12 h-12 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#1e3a8a]" />
                </div>
                <h3 className="font-semibold text-lg text-[#1e3a8a] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell / Trade Section - Light Background */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <DollarSign className="w-4 h-4" />
                Sell or Trade
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
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
              <button className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg">
                Get Your Offer
              </button>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Quick Estimate</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Year, Make, Model" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" />
                <input type="text" placeholder="Mileage (km)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20" />
                <button className="w-full px-6 py-3 bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold rounded-xl transition-colors">
                  Get Instant Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Buy your next car in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Browse & Select", desc: "Explore our inventory with detailed photos, history, and inspection reports." },
              { num: "2", title: "Get Approved", desc: "Apply for financing in minutes. We work with 20+ lenders for the best rate." },
              { num: "3", title: "Delivery or Pickup", desc: "Get your car delivered or pick it up. 10-day return guarantee included." },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-[#1e3a8a] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#1e3a8a]">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
              4.8 Star Rating
            </h2>
            <p className="text-gray-600">See what our customers say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "James D.", location: "Toronto", car: "Tesla Model Y", text: "Planet Motors made buying a car online incredibly easy. The 10-day return policy gave me peace of mind." },
              { name: "Sarah M.", location: "Mississauga", car: "Hyundai Ioniq 5", text: "Best car buying experience ever. No pressure, transparent pricing, and the car was exactly as described." },
              { name: "Michael K.", location: "Scarborough", car: "Toyota RAV4", text: "Traded in my old car and got a great deal. The whole process took less than an hour!" },
            ].map((review, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(j => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&quot;{review.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white font-semibold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-[#1e3a8a]">{review.name}</div>
                    <div className="text-gray-500 text-sm">{review.location} - {review.car}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-[#1e3a8a] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Next Vehicle?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Browse our inventory or get pre-approved in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-xl transition-colors">
              Browse Inventory
            </button>
            <button className="px-8 py-4 bg-white text-[#1e3a8a] font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              Get Pre-Approved
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Image 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Planet-Motors---Logo-Final%20Transp%20Back-lBOeordAvQp4WQW3K6p5yxuD3w9XwL.jpeg"
                alt="Planet Motors"
                width={120}
                height={60}
                className="h-12 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm">
                Ontario&apos;s trusted online dealership. Fairness. Integrity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/inventory" className="hover:text-white">All Vehicles</Link></li>
                <li><Link href="/electric-vehicles" className="hover:text-white">Electric Vehicles</Link></li>
                <li><Link href="/inventory?bodyStyle=SUV" className="hover:text-white">SUVs</Link></li>
                <li><Link href="/sell-your-car" className="hover:text-white">Sell Your Car</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/reviews" className="hover:text-white">Reviews</Link></li>
                <li><Link href="/financing" className="hover:text-white">Financing</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>(416) 555-1234</li>
                <li>info@planetmotors.ca</li>
                <li>Scarborough, ON</li>
                <li>Mon-Fri: 9AM-7PM | Sat: 9AM-6PM</li>
              </ul>
            </div>
          </div>
          
          {/* Certifications */}
          <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-gray-800">
            <span className="text-gray-500 text-sm">OMVIC Licensed</span>
            <span className="text-gray-500 text-sm">UCDA Member</span>
            <span className="text-gray-500 text-sm">BBB Accredited</span>
          </div>

          <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-800">
            © 2026 Planet Motors. All rights reserved. | Privacy Policy | Terms of Service
          </div>
        </div>
      </footer>
    </div>
  )
}
