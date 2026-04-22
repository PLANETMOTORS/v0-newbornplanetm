// Mid-fold homepage sections — code-split from homepage-content.tsx
// Includes Shop By Category + 4-Step Process (both below hero fold)
// to reduce initial JS bundle and improve LCP/TBT
import Link from "next/link"
import { ArrowRight, Shield, Car, CheckCircle, Star, Zap, Award, DollarSign, Users, Leaf, Search, CreditCard, FileCheck, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

// Shop by category chips
const shopByCategories = [
  { icon: DollarSign, label: "Under $30k", href: "/inventory?maxPrice=30000", iconColor: "text-green-700" },
  { icon: Car, label: "SUVs", href: "/inventory?bodyType=SUV", iconColor: "text-slate-600" },
  { icon: Zap, label: "Electric", href: "/inventory?fuelType=Electric", iconColor: "text-emerald-500" },
  { icon: Leaf, label: "Hybrids", href: "/inventory?fuelType=Hybrid", iconColor: "text-teal-500" },
  { icon: Star, label: "Luxury", href: "/inventory?category=Luxury", iconColor: "text-amber-500" },
  { icon: Users, label: "Family", href: "/inventory?category=Family", iconColor: "text-blue-500" },
]

// 4-Step Process with colorful icons
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
    features: ["Soft Credit Check", "No Credit Impact", "Rates from 6.29%", "Instant Decision"],
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

export function HomepageMidFold() {
  return (
    <>
      {/* Shop By Category - Carvana Style Large Boxes */}
      <section className="py-16 bg-white border-b border-[#dce3ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
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

      {/* ========== 4-STEP PROCESS ========== */}
      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Step {index + 1}</span>
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
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Backed by our 10-Day Money-Back Guarantee
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
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
    </>
  )
}
