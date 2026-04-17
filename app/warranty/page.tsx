import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Warranty & Protection Plans | Planet Motors",
  description: "Drive with confidence. Explore extended warranty and protection plans from Planet Motors. Coverage options for every budget.",
}

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle2, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { WarrantyPageJsonLd } from "@/components/seo/json-ld"

const warrantyPlans = [
  {
    name: "Standard Coverage",
    price: "Included",
    duration: "30 Days / 1,500 km",
    description: "Every Planet Motors vehicle includes basic coverage",
    features: [
      "Engine & transmission coverage",
      "24/7 roadside assistance",
      "Towing up to 100 km",
      "Trip interruption benefits"
    ],
    highlighted: false
  },
  {
    name: "Protection Plus",
    price: "$1,299",
    duration: "2 Years / 40,000 km",
    description: "Extended protection for worry-free ownership",
    features: [
      "All Standard Coverage benefits",
      "Electrical system coverage",
      "Air conditioning & heating",
      "Steering & suspension",
      "Brakes & ABS system",
      "$0 deductible option"
    ],
    highlighted: true
  },
  {
    name: "Ultimate Shield",
    price: "$2,499",
    duration: "5 Years / 100,000 km",
    description: "Comprehensive bumper-to-bumper protection",
    features: [
      "All Protection Plus benefits",
      "High-tech electronics",
      "Navigation & infotainment",
      "Seals & gaskets",
      "Rental car coverage",
      "Transferable warranty",
      "No deductible"
    ],
    highlighted: false
  }
]

const coverageDetails = [
  {
    category: "Powertrain",
    items: ["Engine", "Transmission", "Transfer case", "Drive axles", "Drivetrain components"]
  },
  {
    category: "Electrical",
    items: ["Starter motor", "Alternator", "Wiring harnesses", "Power windows", "Power locks"]
  },
  {
    category: "Climate Control",
    items: ["A/C compressor", "Heater core", "Blower motor", "Climate sensors", "HVAC controls"]
  },
  {
    category: "Steering & Suspension",
    items: ["Power steering", "Rack and pinion", "Control arms", "Ball joints", "Wheel bearings"]
  }
]

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-background">
      <WarrantyPageJsonLd />
      <Header />

      <main className="pt-32 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Planet Motors Protection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 text-balance">
              Drive with Confidence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every vehicle includes our standard warranty. Upgrade to extended protection
              for complete peace of mind on the road.
            </p>
          </div>
        </section>

        {/* Warranty Plans */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {warrantyPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted ? "border-primary shadow-lg scale-105" : ""}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </div>
                  <CardDescription>{plan.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                    {plan.price === "Included" ? "Included with Purchase" : "Add to Purchase"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Coverage Details */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">What&apos;s Covered</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {coverageDetails.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {category.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Claims Process */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Easy Claims Process</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Call Us", desc: "Contact our claims hotline 24/7" },
              { step: 2, title: "Get Approved", desc: "Quick approval, usually same day" },
              { step: 3, title: "Visit Any Shop", desc: "Choose any certified repair facility" },
              { step: 4, title: "We Pay Direct", desc: "No out-of-pocket expenses" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold mb-4">Questions About Coverage?</h2>
            <p className="mb-8 opacity-90">
              Our warranty specialists are here to help you choose the right protection.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="secondary" size="lg" asChild>
                <a href="tel:1-866-797-3332">
                  <Phone className="w-4 h-4 mr-2" />
                  Call 1-866-797-3332
                </a>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="/contact">
                  <FileText className="w-4 h-4 mr-2" />
                  Request Details
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
