import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, CreditCard, FileCheck, Truck, Car, Shield, 
  CheckCircle, ArrowRight, RotateCcw, Heart, Star
} from "lucide-react"

const buyingSteps = [
  {
    icon: Search,
    title: "Browse & Select",
    description: "Explore our inventory of quality vehicles. Use filters to find your perfect match, view 360° photos, and check detailed specs.",
    details: ["360° vehicle photos", "Detailed inspection reports", "Vehicle history included", "Compare up to 3 vehicles"]
  },
  {
    icon: CreditCard,
    title: "Reserve & Finance",
    description: "Reserve your vehicle with a $250 refundable deposit. Get pre-approved for financing in minutes with rates starting at 6.29% APR.",
    details: ["$250 refundable deposit", "20+ lender partners", "Pre-approval in minutes", "No credit score impact"]
  },
  {
    icon: FileCheck,
    title: "Complete Purchase",
    description: "Finalize your paperwork online. Our team handles all documentation including registration, insurance, and trade-in coordination.",
    details: ["Digital document signing", "Trade-in coordination", "Insurance assistance", "Registration handled"]
  },
  {
    icon: Truck,
    title: "Delivery or Pickup",
    description: "Choose home delivery with competitive rates anywhere in Canada. Or pick up at our Richmond Hill showroom.",
    details: ["Affordable delivery rates", "Nationwide shipping", "Scheduled delivery times", "Vehicle walk-through"]
  },
  {
    icon: RotateCcw,
    title: "10-Day Returns",
    description: "Take 10 days to make sure you love your new vehicle. If not, return it for a full refund with our money-back guarantee.",
    details: ["No questions asked", "Full refund guarantee", "Free return pickup", "Up to 500km allowed"]
  }
]

const sellingSteps = [
  {
    icon: Car,
    title: "Get Your Instant Offer",
    description: "Enter your license plate or VIN and get an instant competitive offer for your vehicle in seconds."
  },
  {
    icon: FileCheck,
    title: "Verify & Confirm",
    description: "Answer a few questions about your vehicle condition. If accurate, your offer is locked in."
  },
  {
    icon: Truck,
    title: "Schedule Free Pickup",
    description: "Choose a convenient time for us to pick up your vehicle - anywhere in Canada, completely free."
  },
  {
    icon: CreditCard,
    title: "Get Paid",
    description: "Receive your payment via e-Transfer or cheque within 24-48 hours of pickup."
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">Simple Process</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              How Planet Motors Works
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Buying or selling a car has never been easier. Our streamlined process 
              takes the stress out of car shopping.
            </p>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { icon: Shield, text: "210-Point Inspection" },
                { icon: RotateCcw, text: "10-Day Returns" },
                { icon: Star, text: "4.8 Star Rating" },
                { icon: Heart, text: "Happy Customers" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <badge.icon className="h-5 w-5 text-primary" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buying Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">Buy a Car</Badge>
              <h2 className="text-3xl font-bold mb-4">5-Step Buying Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From browsing to delivery, we have made buying a car as simple as online shopping.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {buyingSteps.map((step, i) => (
                <div key={i} className="flex gap-6 mb-12 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <step.icon className="h-8 w-8" />
                    </div>
                    {i < buyingSteps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-4" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">Step {i + 1}</Badge>
                      <h3 className="font-bold text-xl">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {step.details.map((detail, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/inventory">
                <Button size="lg">
                  Browse Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Visual Break */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-5xl font-bold text-primary mb-2">$250</p>
                <p className="font-medium text-sm sm:text-base">Refundable Deposit</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Reserve any vehicle risk-free</p>
              </div>
              <div>
                <p className="text-3xl sm:text-5xl font-bold text-primary mb-2">10 Days</p>
                <p className="font-medium text-sm sm:text-base">Money-Back Guarantee</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Love it or return it</p>
              </div>
              <div>
                <p className="text-3xl sm:text-5xl font-bold text-primary mb-2">FREE</p>
                <p className="font-medium text-sm sm:text-base">Delivery within 300km</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Or competitive rates nationwide</p>
              </div>
            </div>
          </div>
        </section>

        {/* Selling Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="secondary">Trade-In</Badge>
              <h2 className="text-3xl font-bold mb-4">4-Step Trade-In Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get a competitive trade-in offer without leaving home.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-5xl mx-auto">
              {sellingSteps.map((step, i) => (
                <Card key={i} className="text-center relative">
                  {i < sellingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="mb-3">Step {i + 1}</Badge>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/trade-in">
                <Button size="lg" variant="secondary">
                  Get Your Offer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of Canadians who have found their perfect vehicle with Planet Motors.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/inventory">
                <Button size="lg" variant="secondary">
                  Browse Inventory
                </Button>
              </Link>
              <Link href="/trade-in">
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Trade-In Your Car
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
