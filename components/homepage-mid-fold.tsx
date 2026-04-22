// Mid-fold homepage sections — code-split from homepage-content.tsx
// Includes Shop By Category + 4-Step Process (both below hero fold)
// to reduce initial JS bundle and improve LCP/TBT
import Link from "next/link"
import { ArrowRight, Shield, Car, CheckCircle, Zap, Award, DollarSign, Search, CreditCard, FileCheck, Home, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RATE_FLOOR_DISPLAY } from "@/lib/rates"

// Navy brand color used for all category icons and labels
const NAVY = "#1B2A6B"

// Shop by category pills — 4 tiles, ordered by conversion priority
// All icons: same Lucide import, stroke-width 2, same navy color
const shopByCategories = [
  { icon: Zap, label: "Electric", href: "/inventory?fuelType=Electric", popular: false },
  { icon: Car, label: "SUVs", href: "/inventory?bodyType=SUV", popular: true },
  { icon: DollarSign, label: "Under $30k", href: "/inventory?maxPrice=30000", popular: false },
  { icon: Gem, label: "Luxury", href: "/inventory?category=Luxury", popular: false },
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
    features: ["Soft Credit Check", "No Credit Impact", `Rates from ${RATE_FLOOR_DISPLAY}`, "Instant Decision"],
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
    description: "Choose free home delivery within 300 km of Richmond Hill, paid shipping across Canada, or pick up from our Richmond Hill showroom at your convenience.",
    features: ["Free Delivery Within 300 km", "Canada-Wide Shipping", "10-Day Returns", "Next-Day Pickup"],
  },
]

export function HomepageMidFold() {
  return (
    <>
      {/* Shop By Category — horizontal pills */}
      <section className="py-16 bg-white border-b border-[#dce3ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              What Are You Looking For?
            </h2>
          </div>

          {/* Grid: mobile 2×2 stacked, tablet 2×2 horizontal, desktop 4-in-a-row horizontal */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {shopByCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={[
                  "group relative",
                  // Mobile: stacked layout, 96px tall
                  "flex flex-col items-center justify-center h-24 gap-1",
                  // Tablet+: horizontal layout, 80px tall
                  "md:flex-row md:h-20 md:gap-3 md:justify-start md:px-4",
                  // Shared styling
                  "bg-white rounded-xl border border-[#e5e7eb] p-4",
                  // Hover: desktop/tablet only — bg shift + icon scale
                  "md:hover:bg-[rgba(27,42,107,0.04)] transition-all duration-200 ease-out",
                ].join(" ")}
              >
                {/* Popular badge — absolute positioned */}
                {cat.popular && (
                  <span
                    className="absolute -top-2.5 -right-2.5 z-10 bg-[#CC1122] text-white uppercase tracking-wide shadow-[0_2px_4px_rgba(0,0,0,0.15)] rounded-full"
                    style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px" }}
                  >
                    Popular
                  </span>
                )}
                {/* Icon — 32px mobile, 40px desktop; same navy, stroke-width 2 */}
                <cat.icon
                  className="w-8 h-8 md:w-10 md:h-10 md:group-hover:scale-105 transition-transform duration-200 ease-out flex-shrink-0"
                  style={{ color: NAVY, strokeWidth: 2 }}
                  aria-hidden="true"
                />
                {/* Label — 14px mobile, 15px desktop */}
                <span
                  className="text-center md:text-left leading-tight text-sm md:text-[15px]"
                  style={{ fontWeight: 600, color: NAVY }}
                >
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>

          {/* See all categories → */}
          <div className="flex justify-end mt-4">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{ fontSize: 14, fontWeight: 600, color: NAVY }}
            >
              See all categories
              <ArrowRight className="w-4 h-4" />
            </Link>
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
