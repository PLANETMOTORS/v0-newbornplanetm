"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Shield, RotateCcw, CheckCircle, Star, ArrowRight, Menu, Phone, MapPin } from "lucide-react"

// Mockup: Trust-First Homepage Design for Planet Motors
// Inspired by Clutch.ca's award-winning UX

export default function HomepageMockup() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Bar - Contact Info */}
      <div className="bg-[#1a1a2e] text-white/80 text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:+14165551234" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              (416) 555-1234
            </a>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Toronto, ON
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Mon-Sat: 9AM-7PM</span>
            <span className="text-orange-400 font-medium">OMVIC Licensed</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PM</span>
            </div>
            <div>
              <span className="font-bold text-xl text-[#1a1a2e]">Planet Motors</span>
              <span className="hidden sm:inline text-xs text-gray-500 ml-2">Electric Vehicles</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#" className="text-gray-700 hover:text-[#1a1a2e] font-medium transition-colors">
              Browse EVs
            </Link>
            <Link href="#" className="text-gray-700 hover:text-[#1a1a2e] font-medium transition-colors">
              How It Works
            </Link>
            <Link href="#" className="text-gray-700 hover:text-[#1a1a2e] font-medium transition-colors">
              Financing
            </Link>
            <Link href="#" className="text-gray-700 hover:text-[#1a1a2e] font-medium transition-colors">
              About Us
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:block px-4 py-2 text-[#1a1a2e] font-medium hover:bg-gray-100 rounded-lg transition-colors">
              Sign In
            </button>
            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md shadow-orange-500/20">
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

        {/* Trust Bar */}
        <div className="bg-[#f8f9fa] border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 md:gap-12 text-sm overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <RotateCcw className="w-4 h-4 text-green-600" />
              <span className="font-medium">10-Day Returns</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">210-Point Inspection</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">No Hidden Fees</span>
            </div>
            <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <Star className="w-4 h-4 text-green-600" />
              <span className="font-medium">4.9/5 Google Rating</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#1a1a2e] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now Available: 2024 Models
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Buy Your Next
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  Electric Vehicle
                </span>
                With Confidence
              </h1>
              
              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg mx-auto lg:mx-0">
                Ontario&apos;s trusted online EV dealership. Browse, finance, and get your car delivered - all from home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group">
                  Browse Inventory
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors backdrop-blur-sm border border-white/20">
                  How It Works
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-12 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-white/60 text-sm">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">20+</div>
                  <div className="text-white/60 text-sm">Lender Partners</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-white/60 text-sm">Google Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-white/40">Featured Vehicle Image</p>
                  <p className="text-white/30 text-sm">e.g., Tesla Model 3</p>
                </div>
              </div>

              {/* Floating Price Tag */}
              <div className="absolute -bottom-4 -left-4 bg-white text-[#1a1a2e] px-6 py-4 rounded-2xl shadow-xl">
                <div className="text-sm text-gray-500">Starting from</div>
                <div className="text-2xl font-bold">$299/mo</div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Low Rates Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Buy your next car in 3 simple steps - no dealership visits required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <span className="text-3xl font-bold text-orange-500 group-hover:text-white transition-colors">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1a1a2e]">Browse & Select</h3>
              <p className="text-gray-600">
                Explore our curated inventory of quality EVs. Every vehicle includes detailed photos, history report, and 210-point inspection results.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <span className="text-3xl font-bold text-orange-500 group-hover:text-white transition-colors">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1a1a2e]">Get Approved</h3>
              <p className="text-gray-600">
                Apply for financing in minutes. We work with 20+ lenders to find you the best rate, regardless of credit history.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <span className="text-3xl font-bold text-orange-500 group-hover:text-white transition-colors">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1a1a2e]">Delivery or Pickup</h3>
              <p className="text-gray-600">
                Get your car delivered to your door or pick it up at our location. Either way, you have 10 days to make sure you love it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-6">
                Why 500+ Customers
                <span className="block text-orange-500">Trust Planet Motors</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                We&apos;re not just another dealership. We&apos;re building a new way to buy cars - transparent, fair, and designed around you.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1a2e] mb-1">10-Day Money-Back Guarantee</h3>
                    <p className="text-gray-600 text-sm">Not happy? Return it within 10 days for a full refund. No questions asked.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1a2e] mb-1">210-Point Inspection</h3>
                    <p className="text-gray-600 text-sm">Every vehicle undergoes rigorous inspection. We fix issues before you see it.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1a2e] mb-1">No Hidden Fees</h3>
                    <p className="text-gray-600 text-sm">The price you see is the price you pay. Transparent pricing, always.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl text-[#1a1a2e] mb-6 leading-relaxed">
                &quot;I was skeptical about buying a car online, but Planet Motors made it incredibly easy. The car arrived exactly as described, and the 10-day return policy gave me peace of mind.&quot;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-500">JD</span>
                </div>
                <div>
                  <div className="font-semibold text-[#1a1a2e]">James D.</div>
                  <div className="text-gray-500 text-sm">Toronto, ON - Purchased Tesla Model Y</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image 
                    src="/google-logo.svg" 
                    alt="Google" 
                    width={24} 
                    height={24}
                    className="opacity-70"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className="text-gray-500 text-sm">4.9/5 from 200+ reviews</span>
                </div>
                <Link href="#" className="text-orange-500 font-medium text-sm hover:underline">
                  Read all reviews
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Inventory */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">
                Featured Vehicles
              </h2>
              <p className="text-gray-600">Hand-picked EVs ready for delivery</p>
            </div>
            <Link href="#" className="hidden md:flex items-center gap-2 text-orange-500 font-semibold hover:gap-3 transition-all">
              View All Inventory
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vehicle Card 1 */}
            {[
              { name: "Tesla Model 3", year: 2023, price: "$42,900", monthly: "$399/mo", range: "358 km", badge: "Popular" },
              { name: "Hyundai Ioniq 5", year: 2024, price: "$48,500", monthly: "$449/mo", range: "488 km", badge: "New Arrival" },
              { name: "Ford Mustang Mach-E", year: 2023, price: "$52,900", monthly: "$489/mo", range: "402 km", badge: null },
            ].map((car, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all">
                {/* Image */}
                <div className="relative aspect-[16/10] bg-gray-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm mt-2">Vehicle Image</p>
                    </div>
                  </div>
                  {car.badge && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {car.badge}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-[#1a1a2e] group-hover:text-orange-500 transition-colors">
                        {car.year} {car.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{car.range} range</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-2xl font-bold text-[#1a1a2e]">{car.price}</div>
                      <div className="text-sm text-gray-500">or {car.monthly}</div>
                    </div>
                    <button className="px-4 py-2 bg-[#1a1a2e] hover:bg-orange-500 text-white font-medium rounded-lg transition-colors text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="#" className="inline-flex items-center gap-2 text-orange-500 font-semibold">
              View All Inventory
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1a1a2e] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Perfect EV?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Get pre-approved in minutes with no impact to your credit score. See your real rate and monthly payment before you shop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/30">
              Get Pre-Approved Now
            </button>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20">
              Browse Inventory
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f0f1a] text-white/60 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PM</span>
                </div>
                <span className="font-bold text-xl text-white">Planet Motors</span>
              </div>
              <p className="text-sm mb-4">
                Ontario&apos;s trusted online EV dealership. Buy with confidence.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-xs">OMVIC Licensed</div>
                <div className="text-xs">UCDA Member</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Browse Inventory</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Financing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Trade-In</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Reviews</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">10-Day Returns</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Warranty</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div>&copy; 2026 Planet Motors. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <span>Made with trust in Toronto</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
