import Link from "next/link"
import { ArrowRight, Shield, RotateCw, Car, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VehicleShowcase } from "@/components/vehicle-showcase"

const stats = [
  { value: "9,500+", label: "Vehicles in Stock" },
  { value: "360°", label: "Interactive Views" },
  { value: "99.9%", label: "Customer Satisfaction" },
  { value: "24/7", label: "Online Support" },
]

const features = [
  {
    icon: RotateCw,
    title: "360° Vehicle Views",
    description: "Explore every angle of your future vehicle with our interactive 360-degree spin viewer. Powered by AVIF-optimized images for lightning-fast loading.",
  },
  {
    icon: Shield,
    title: "Protection Plans",
    description: "Comprehensive coverage options to protect your investment. Choose from Basic, Premium, or Ultimate protection plans.",
  },
  {
    icon: Car,
    title: "Premium Selection",
    description: "Curated collection of over 9,500 premium vehicles. Every car is inspected and certified to meet our quality standards.",
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-tight">
                Experience vehicles like never before
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Explore our collection of premium vehicles with interactive 360-degree views. Every detail, every angle, at your fingertips.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/inventory">
                    Browse Inventory
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/viewer">
                    Try 360° Viewer
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <VehicleShowcase />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl md:text-4xl font-semibold text-primary">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Why choose Planet Motors
            </h2>
            <p className="mt-4 text-muted-foreground">
              We combine cutting-edge technology with exceptional service to deliver the best car buying experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl p-8 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Plans Section */}
      <section id="protection-plans" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Protection Plans
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choose the coverage that fits your needs. All plans include our satisfaction guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {protectionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
                    : "bg-card border-border"
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-semibold">${plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-8"
                  variant={plan.highlighted ? "secondary" : "default"}
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
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold max-w-2xl mx-auto text-balance">
            Ready to find your perfect vehicle?
          </h2>
          <p className="mt-6 text-primary-foreground/80 max-w-xl mx-auto">
            Browse our entire inventory online or visit our showroom. Our team is here to help you every step of the way.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/inventory">
                View All Vehicles
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
