"use client"

// Planet Motors Homepage - OMVIC Licensed Dealer #4048307
import Link from "next/link"
import { ArrowRight, Shield, RotateCw, Car, CheckCircle, Star, BadgeCheck, Clock, Zap, Battery, Phone, MapPin, TrendingUp, Award, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VehicleShowcase } from "@/components/vehicle-showcase"
import { HowItWorks } from "@/components/how-it-works"
import { TrustBadges } from "@/components/trust-badges"

const stats = [
  { value: "9,500+", label: "Vehicles in Stock", trend: "+124 this week" },
  { value: "210", label: "Point Inspection", trend: "Industry-leading standard" },
  { value: "10-Day", label: "Money Back Guarantee", trend: "No questions asked" },
  { value: "4.79%", label: "Lowest APR Rate", trend: "Financing from major lenders" },
]

const features = [
  {
    icon: RotateCw,
    title: "360° Vehicle Views",
    description: "Explore every angle with our interactive viewer. AVIF-optimized images for lightning-fast loading across 9,500+ vehicles.",
  },
  {
    icon: Shield,
    title: "210-Point Inspection",
    description: "Every vehicle passes our comprehensive inspection - 60 points more than Carvana. Full transparency with detailed reports.",
  },
  {
    icon: Battery,
    title: "EV Battery Health",
    description: "Exclusive battery health certification for electric vehicles. Know exactly what you are getting - a feature competitors do not offer.",
  },
  {
    icon: Car,
    title: "Free Nationwide Delivery",
    description: "Free delivery anywhere in Canada. Headquartered in Richmond Hill, serving Canadians coast to coast. OMVIC licensed.",
  },
]

const trustBadges = [
  { icon: BadgeCheck, label: "OMVIC Licensed" },
  { icon: Shield, label: "10-Day Returns" },
  { icon: Star, label: "4.9/5 Rating" },
  { icon: Clock, label: "24/7 Support" },
]

const reviews = [
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

const lenders = [
  { name: "TD Auto", rate: "4.99%" },
  { name: "RBC", rate: "5.49%" },
  { name: "Scotiabank", rate: "5.29%" },
  { name: "BMO", rate: "5.99%" },
  { name: "CIBC", rate: "5.49%" },
  { name: "Desjardins", rate: "4.79%" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border text-sm text-muted-foreground shadow-sm">
                <badge.icon className="w-4 h-4 text-primary" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Live inventory badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-full text-sm font-medium mb-6 shadow-sm">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-green-600 font-semibold">124 new arrivals</span>
                </span>
                <span className="w-px h-4 bg-border" />
                <span className="text-muted-foreground">Updated 2 min ago</span>
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
                The Smarter Way to{" "}
                <span className="text-primary">Buy or Sell</span>{" "}
                Your Car
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Ontario&apos;s trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.
              </p>
              
              {/* Search quick links */}
              <div className="mt-8 flex flex-wrap gap-2">
                {["SUV", "Sedan", "Electric", "Luxury", "Under $20k"].map((tag) => (
                  <Link 
                    key={tag}
                    href={`/inventory?type=${tag.toLowerCase()}`}
                    className="px-4 py-2 bg-muted text-sm font-medium rounded-full hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/inventory">
                    Browse Inventory
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sell">
                    Sell Your Car
                  </Link>
                </Button>
              </div>

              {/* Financing teaser */}
              <div className="mt-8 p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Financing from</p>
                    <p className="text-2xl font-semibold text-primary">4.79% APR</p>
                  </div>
                  <div className="flex -space-x-2">
                    {lenders.slice(0, 4).map((lender) => (
                      <div 
                        key={lender.name}
                        className="w-10 h-10 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-medium"
                        title={lender.name}
                      >
                        {lender.name.slice(0, 2)}
                      </div>
                    ))}
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full border-2 border-background flex items-center justify-center text-xs font-medium">
                      +2
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/financing">Get Pre-Approved</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <VehicleShowcase />
              <div className="absolute -bottom-4 left-4 right-4 flex justify-center">
                <div className="bg-card px-4 py-2 rounded-full shadow-lg border border-border flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    53 viewing now
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-sm text-muted-foreground">Updated 2 min ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="relative group text-center p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="font-serif text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {stat.label}
                </div>
                <div className="mt-1 text-xs text-green-600 font-medium">
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-card relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1">
              <Award className="w-3 h-3 mr-1" />
              Industry-Leading Features
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Why Planet Motors Wins
            </h2>
            <p className="mt-4 text-muted-foreground">
              60 more inspection points than Clutch. Better rates than Carvana. EV expertise no one else offers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-background rounded-2xl p-6 border border-border hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison callout */}
          <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-3xl border border-primary/20 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">See the Full Comparison</h3>
                  <p className="text-muted-foreground mt-1">
                    Planet Motors beats Clutch.ca and Carvana in 8 of 12 key categories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>210 Inspection Points</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>6 Lenders</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>4.79% APR</span>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/inventory">
                    Browse Inventory
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              What Our Customers Say
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-muted-foreground">4.9/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.name} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} 
                    />
                  ))}
                </div>
                <p className="text-foreground mb-4">&quot;{review.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.location}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Plans Section */}
      <section id="protection-plans" className="py-20 lg:py-28 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              Protection Plans
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choose the coverage that fits your needs. All plans include our satisfaction guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {protectionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-background border-border"
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
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-balance">
                Ready to find your perfect vehicle?
              </h2>
              <p className="mt-6 text-primary-foreground/80 max-w-xl">
                Browse our entire inventory online or visit our showroom in Richmond Hill. Our team is here to help you every step of the way.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
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
            <div className="bg-primary-foreground/10 rounded-2xl p-8">
              <h3 className="font-semibold text-xl mb-6">Visit Our Showroom</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">30 Major Mackenzie E</p>
                    <p className="text-primary-foreground/80">Richmond Hill, ON L4C 1G7</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">1-866-787-3332</p>
                    <p className="text-primary-foreground/80">Local: 416-985-2277</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Mon-Sat: 9AM - 8PM</p>
                    <p className="text-primary-foreground/80">Sun: 10AM - 6PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Trust Badges */}
      <TrustBadges />
      
      <Footer />
    </div>
  )
}
