"use client"

import { Search, CreditCard, CalendarCheck, Truck, ArrowRight, CheckCircle, Clock, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const steps = [
  {
    icon: Search,
    step: 1,
    title: "Browse & Select",
    description: "Explore our certified vehicles with 360° views, detailed inspection reports, and transparent pricing.",
    features: ["360° Interactive Views", "210-Point Inspection Reports", "Price Match Guarantee"],
    time: "5 min",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: CreditCard,
    step: 2,
    title: "Get Pre-Approved",
    description: "Apply in 2 minutes with no credit impact. Compare offers from 20+ Canadian lenders instantly.",
    features: ["No Credit Impact", "20+ Lender Options", "Rates from 6.29%"],
    time: "2 min",
    color: "from-green-500 to-green-600"
  },
  {
    icon: CalendarCheck,
    step: 3,
    title: "Complete Purchase",
    description: "Sign documents digitally, finalize financing, and add protection plans - all online.",
    features: ["Digital Signatures", "Trade-In Processing", "Warranty Options"],
    time: "15 min",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Truck,
    step: 4,
    title: "Delivery or Pickup",
    description: "Free Ontario delivery to your door or pickup from our Richmond Hill location. 10-day money-back guarantee.",
    features: ["Free Ontario Delivery", "10-Day Returns", "Real-Time Tracking"],
    time: "1-3 days",
    color: "from-orange-500 to-orange-600"
  }
]

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple 4-Step Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Buy Your Car 100% Online
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From browsing to delivery, complete your entire car purchase from the comfort of your home.
            Most customers complete the process in under 30 minutes.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block relative max-w-6xl mx-auto mb-16">
          {/* Connector Line */}
          <div className="absolute top-24 left-[10%] right-[10%] h-1 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-orange-500 rounded-full" />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Step Circle with gradient */}
                <div className={`relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${item.color} text-white shadow-lg flex items-center justify-center mb-6`}>
                  <item.icon className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary text-primary text-sm font-bold flex items-center justify-center shadow">
                    {item.step}
                  </span>
                </div>

                {/* Time badge */}
                <div className="flex justify-center mb-4">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </Badge>
                </div>

                <h3 className="font-semibold text-lg mb-2 text-center">{item.title}</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">{item.description}</p>
                
                {/* Feature list */}
                <ul className="space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-6 max-w-md mx-auto">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-20 left-6 w-0.5 h-full bg-gradient-to-b from-primary to-primary/20" />
              )}
              
              <div className="flex gap-4">
                <div className={`relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${item.color} text-white shadow-lg flex items-center justify-center`}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {item.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <ul className="space-y-1">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-full text-sm text-green-700 dark:text-green-400 mb-6">
            <Shield className="w-4 h-4" />
            <span>Protected by our 10-Day Money-Back Guarantee</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/inventory">
                Start Shopping
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
