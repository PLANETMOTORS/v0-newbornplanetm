"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Shield, Car, CheckCircle, Star, Clock, Phone, MapPin, ChevronRight, DollarSign, RefreshCw, Truck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// Live social proof data
const recentActivity = [
  { name: "Sarah M.", city: "Richmond Hill", action: "just picked up", vehicle: "2022 Toyota RAV4", time: "2 min ago" },
  { name: "Michael T.", city: "Markham", action: "got approved for", vehicle: "2021 Honda Civic", time: "5 min ago" },
  { name: "Jessica L.", city: "Toronto", action: "started financing", vehicle: "2023 Mazda CX-5", time: "8 min ago" },
]

const trustStats = [
  { value: "9,500+", label: "Vehicles Available" },
  { value: "4.8", label: "Customer Rating", suffix: "/5" },
  { value: "10", label: "Day Money Back", suffix: " Days" },
  { value: "$0", label: "Down Payment Options" },
]

export default function HomepageMockup() {
  const [monthlyBudget, setMonthlyBudget] = useState([400])
  const [activeProof, setActiveProof] = useState(0)

  // Calculate price range based on monthly payment (rough estimate)
  const estimatedMaxPrice = Math.round(monthlyBudget[0] * 60) // ~5 year term estimate
  const vehicleCount = Math.round((monthlyBudget[0] / 800) * 124) // Simulated count

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      
      {/* Floating Badge - This is a MOCKUP */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
        MOCKUP PREVIEW - Not Live
      </div>

      {/* Hero Section - Budget First Approach */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left - Content */}
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-zinc-300">10-Day Money Back Guarantee</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Find Your Car by{" "}
                <span className="text-orange-500">Budget</span>
              </h1>
              
              <p className="text-xl text-zinc-400 max-w-lg">
                Set your monthly payment. See only cars you can actually afford. No surprises, no wasted time.
              </p>

              {/* Budget Slider - THE KEY FEATURE */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Monthly Budget</span>
                  <span className="text-3xl font-bold text-orange-500">
                    ${monthlyBudget[0]}<span className="text-lg text-zinc-500">/mo</span>
                  </span>
                </div>
                
                <Slider
                  value={monthlyBudget}
                  onValueChange={setMonthlyBudget}
                  min={150}
                  max={800}
                  step={25}
                  className="py-4"
                />
                
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>$150/mo</span>
                  <span>$800/mo</span>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Estimated vehicle price</p>
                    <p className="text-xl font-semibold">Up to ${estimatedMaxPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Available vehicles</p>
                    <p className="text-xl font-semibold text-orange-500">{vehicleCount}+ options</p>
                  </div>
                </div>

                <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold h-14 text-lg">
                  Show Me Cars in My Budget
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right - Split Intent Cards */}
            <div className="space-y-4">
              {/* Buy Card */}
              <Link href="/vehicles" className="group block">
                <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-orange-500" />
                        <span className="text-sm text-orange-500 font-medium">I WANT TO</span>
                      </div>
                      <h3 className="text-3xl font-bold">Buy a Car</h3>
                      <p className="text-zinc-400">Browse 9,500+ inspected vehicles</p>
                    </div>
                    <ChevronRight className="h-8 w-8 text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>

              {/* Sell/Trade Card */}
              <Link href="/sell-trade" className="group block">
                <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-6 w-6 text-emerald-500" />
                        <span className="text-sm text-emerald-500 font-medium">I WANT TO</span>
                      </div>
                      <h3 className="text-3xl font-bold">Sell or Trade</h3>
                      <p className="text-zinc-400">Get an instant cash offer in 60 seconds</p>
                    </div>
                    <ChevronRight className="h-8 w-8 text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>

              {/* Financing Card */}
              <Link href="/financing" className="group block">
                <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-blue-500" />
                        <span className="text-sm text-blue-500 font-medium">I NEED</span>
                      </div>
                      <h3 className="text-3xl font-bold">Financing</h3>
                      <p className="text-zinc-400">Get pre-approved in 2 minutes</p>
                    </div>
                    <ChevronRight className="h-8 w-8 text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Social Proof Banner */}
      <section className="bg-zinc-900/50 border-y border-zinc-800 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-zinc-400">
              <span className="text-white font-medium">{recentActivity[activeProof].name}</span>
              {" from "}
              <span className="text-white">{recentActivity[activeProof].city}</span>
              {" " + recentActivity[activeProof].action + " a "}
              <span className="text-orange-500 font-medium">{recentActivity[activeProof].vehicle}</span>
              {" · "}
              <span className="text-zinc-500">{recentActivity[activeProof].time}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-16 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white">
                  {stat.value}
                  {stat.suffix && <span className="text-orange-500">{stat.suffix}</span>}
                </div>
                <p className="text-zinc-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Planet Motors - Feature Grid */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Planet Motors?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We do car buying differently. No pushy salespeople, no hidden fees, no games.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "10-Day Money Back", desc: "Changed your mind? Return it. No questions asked." },
              { icon: CheckCircle, title: "210-Point Inspection", desc: "Every car thoroughly checked before you see it." },
              { icon: Truck, title: "Free Delivery", desc: "To Richmond Hill. Affordable delivery Canada-wide." },
              { icon: Users, title: "No Salespeople", desc: "Browse at your pace. Help when you need it." },
            ].map((feature, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                <feature.icon className="h-10 w-10 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Calculator Preview */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 md:p-12">
            <MapPin className="h-12 w-12 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Free Delivery to Richmond Hill
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Most vehicles delivered within 3-5 business days. Enter your postal code to see your delivery date.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="text" 
                placeholder="Enter postal code (e.g., L4C 1G7)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6">
                Check Delivery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/10 via-zinc-950 to-zinc-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Next Car?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Browse our inventory of 9,500+ vehicles. All inspected, all with our 10-day guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-black font-semibold h-14 px-8 text-lg">
              Browse All Vehicles
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 h-14 px-8 text-lg">
              <Phone className="mr-2 h-5 w-5" />
              Call 416-985-2277
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
