// Below-fold homepage sections — code-split from homepage-content.tsx
// to reduce initial JS bundle and improve LCP/TBT
import Link from "next/link"
import { ArrowRight, Shield, RotateCw, CheckCircle, Star, BadgeCheck, Clock, Battery, Phone, MapPin, DollarSign, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

const protectionPlans = [
  {
    name: "Basic Coverage",
    price: "29",
    period: "/month",
    description: "Essential protection for peace of mind",
    features: ["Powertrain coverage", "24/7 roadside assistance", "Trip interruption coverage", "Rental car reimbursement"],
    highlighted: false,
  },
  {
    name: "Premium Coverage",
    price: "59",
    period: "/month",
    description: "Comprehensive protection for your vehicle",
    features: ["Everything in Basic", "Electrical system coverage", "Air conditioning coverage", "Suspension coverage", "Brake system coverage"],
    highlighted: true,
  },
  {
    name: "Ultimate Coverage",
    price: "99",
    period: "/month",
    description: "Complete bumper-to-bumper protection",
    features: ["Everything in Premium", "Full mechanical coverage", "Electronics & technology", "Interior components", "Appearance protection", "Zero deductible option"],
    highlighted: false,
  },
]

// Default reviews shown on the static page — no server fetch needed
const defaultReviews = [
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

type BelowFoldProps = {
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

export function HomepageBelowFold({ siteSettings, ratingValue, lowestRate, weekdayHours, saturdayHours }: BelowFoldProps) {
  const displayReviews = defaultReviews
  return (
    <>
      {/* ========== WHY CHOOSE US ========== */}
      <section className="py-16 content-visibility-auto contain-intrinsic-size-[auto_500px]" style={{ backgroundColor: "#F3F4F6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose {siteSettings.dealerName}?</h2>
            <p className="text-gray-600 mt-3">Industry-leading standards that set us apart</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {([
              { icon: CheckCircle, title: "210-Point Inspection", description: "Every vehicle passes our comprehensive inspection with full transparency reports." },
              { icon: Battery, title: "EV Battery Health", description: "Exclusive Aviloo battery certification for EVs - know exactly what you're getting." },
              { icon: RotateCw, title: "10-Day Returns", description: "Not satisfied? Return your vehicle within 10 days, no questions asked." },
              { icon: Truck, title: "Ontario-Wide Delivery", description: "Get your vehicle delivered anywhere in Ontario with our convenient delivery service." },
            ] as const).map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-xl bg-white hover:shadow-md transition-shadow">
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

      {/* ========== SELL OR TRADE ========== */}
      <section className="py-16 content-visibility-auto contain-intrinsic-size-[auto_500px]" style={{ backgroundColor: "#E6FFFA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <DollarSign className="w-4 h-4" />
                Sell or Trade
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Have a Vehicle to Sell or Trade?</h2>
              <p className="text-gray-600 text-lg mb-6">Get a competitive offer in minutes. We buy all makes and models - you don&apos;t need to purchase from us to sell to us.</p>
              <ul className="space-y-3 mb-8">
                {["Instant online offer", "Free vehicle pickup", "Same-day payment available", "No obligation to buy from us"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white" asChild>
                <Link href="/trade-in">Get My Offer</Link>
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#dce3ed]">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Estimate</h3>
              <div className="space-y-4">
                <p className="text-gray-600">Get an instant offer for your vehicle in under 60 seconds. No obligation, no haggling.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> VIN or license plate lookup</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Canadian Black Book valuation</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Results in 60 seconds</li>
                </ul>
                <Button className="w-full bg-[#1e3a8a] hover:bg-[#172554]" asChild>
                  <Link href="/trade-in">Get Instant Offer</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CUSTOMER REVIEWS ========== */}
      <section className="py-16 content-visibility-auto contain-intrinsic-size-[auto_400px]" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-600">{ratingValue}/5 Star Rating</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <div key={index} className="bg-[#f0f4f8] rounded-xl p-6 border border-[#dce3ed]">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&quot;{review.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{review.name}</p>
                    <p className="text-sm text-gray-600">{review.location}</p>
                  </div>
                  <span className="text-xs text-gray-600">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PROTECTION PLANS ========== */}
      <section id="protection-plans" className="py-16 content-visibility-auto contain-intrinsic-size-[auto_600px]" style={{ backgroundColor: "#1A202C" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white">Protection Plans</h2>
            <p className="mt-3 text-gray-300">Choose the coverage that fits your needs. All plans include our satisfaction guarantee.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {protectionPlans.map((plan) => (
              <div key={plan.name} className={`rounded-xl p-8 ${plan.highlighted ? "bg-white text-gray-900 ring-2 ring-white ring-offset-2 ring-offset-[#1A202C]" : "bg-white/10 text-white border border-white/20"}`}>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-300"}`}>{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-gray-500" : "text-gray-300"}`}>{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-[#1e3a8a]" : "text-green-400"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full mt-8 ${plan.highlighted ? "bg-[#1e3a8a] text-white hover:bg-[#172554]" : "bg-white text-[#1A202C] hover:bg-[#eef2f7]"}`} asChild>
                  <Link href={`/protection-plans#${plan.name.toLowerCase().replace(" ", "-")}`}>Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-16 content-visibility-auto contain-intrinsic-size-[auto_350px]" style={{ backgroundColor: "#1e5a8e" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Ready to find your perfect vehicle?</h2>
              <p className="mt-4 text-white max-w-xl">Browse our inventory of certified pre-owned vehicles. Get pre-approved for financing in minutes with rates from {lowestRate}% APR.</p>
              <div className="mt-8 flex flex-wrap gap-6">
                <Button size="lg" className="bg-white text-[#1e5a8e] hover:bg-[#eef2f7]" asChild>
                  <Link href="/inventory">Browse Inventory<ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10" asChild>
                  <Link href="/financing">Get Pre-Approved</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-6">
                <Phone className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Call Us</h3>
                <p className="text-sm text-white mt-1">{siteSettings.phone}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <MapPin className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Visit Us</h3>
                <p className="text-sm text-white mt-1">{siteSettings.streetAddress}</p>
                <p className="text-sm text-white">{siteSettings.city}, {siteSettings.province?.slice(0, 2)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <Clock className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Hours</h3>
                <p className="text-sm text-white mt-1">Mon-Fri: {weekdayHours?.open || "9AM"}-{weekdayHours?.close || "7PM"}</p>
                <p className="text-sm text-white">Sat: {saturdayHours?.open || "10AM"}-{saturdayHours?.close || "5PM"}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <BadgeCheck className="w-8 h-8 text-white mb-4" />
                <h3 className="font-semibold text-white">Licensed</h3>
                <p className="text-sm text-white mt-1">OMVIC Registered</p>
                <p className="text-sm text-white">Ontario Dealer</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
