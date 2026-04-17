import Link from "next/link"
import { CheckCircle, Shield, X, Phone, Car, Wrench, Clock, Award, FileText, Sparkles, LockKeyhole, Droplets, CircleDot, PaintBucket } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "PlanetCare Protection Packages | Planet Motors",
  description: "Extended warranty, GAP insurance, and high-value protection options for used cars. Choose from Essential Shield, Smart Secure, or Life Proof coverage.",
}

const packages = [
  {
    id: "essential",
    name: "PlanetCare Essential Shield",
    price: 1950,
    deposit: 250,
    warranty: "Standard",
    tradeInCredit: true,
    pickupDelivery: true,
    tireRim: false,
    antitheft: false,
    benefits: "You're covered for depreciation, repairs, and unforeseen events. If your car is totaled, we'll replace it. Job loss protection ensures next year's payments are covered.",
    maxValue: "$50K Replacement | ~$30k GAP | ~12 Payments",
    highlighted: false,
  },
  {
    id: "smart",
    name: "PlanetCare Smart Secure",
    price: 3000,
    deposit: 250,
    warranty: "Extended",
    tradeInCredit: true,
    pickupDelivery: true,
    tireRim: true,
    antitheft: false,
    benefits: "Comprehensive protection where it matters. Enjoy new-for-old replacement, zero deductibles, loan clearance on death or illness, and payment coverage during disability with true peace of mind included.",
    maxValue: "$60k Replacement | ~$1M Life | ~$500k CI | ~$25k Payments",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "lifeproof",
    name: "PlanetCare Life Proof",
    price: 4850,
    deposit: 250,
    warranty: "Extended",
    tradeInCredit: true,
    pickupDelivery: true,
    tireRim: true,
    antitheft: true,
    benefits: "All-around protection with no surprises. Get new-for-old replacement, zero deductibles, loan clearance on death or illness, payment coverage during disability, plus theft and GAP protection.",
    maxValue: "$60k Replacement | ~$1M Life | ~$500k CI | ~$25k Payments",
    highlighted: false,
    badge: "Best Value",
  },
]

const additionalProducts = [
  {
    name: "Companion GAP Coverage",
    description: "Covers the difference between your car's value and what you owe if it's totaled or stolen.",
    icon: Shield,
  },
  {
    name: "Extended Vehicle Warranty",
    description: "Comprehensive mechanical breakdown protection after manufacturer warranty expires.",
    icon: FileText,
  },
  {
    name: "IncidentPro",
    description: "Protection against accidents, theft, and total loss events with fast claims processing.",
    icon: Car,
  },
  {
    name: "InvisiTrak Anti-Theft System",
    description: "GPS tracking and theft recovery system with 24/7 monitoring and mobile alerts.",
    icon: LockKeyhole,
  },
  {
    name: "Paint Protection Film",
    description: "Clear protective film that shields your paint from chips, scratches, and UV damage.",
    icon: PaintBucket,
  },
  {
    name: "Replacement Warranty Plan",
    description: "New-for-old vehicle replacement if your car is written off within coverage period.",
    icon: Sparkles,
  },
  {
    name: "Rust Protection Coating",
    description: "Professional-grade undercoating to prevent rust and corrosion from Canadian winters.",
    icon: Droplets,
  },
  {
    name: "Tire and Rim Protection",
    description: "Coverage for damage from potholes, nails, curb impact, and road hazards.",
    icon: CircleDot,
  },
  {
    name: "Window Tint Film",
    description: "Premium window tinting for UV protection, privacy, and heat reduction.",
    icon: Wrench,
  },
]

const faqs = [
  {
    question: "Is an extended warranty on a used car worth it?",
    answer: "Yes - an extended warranty can help protect you from costly repairs after the manufacturer warranty expires, especially on pre-owned vehicles. The average major repair costs $1,500-$4,000, making coverage a smart investment.",
  },
  {
    question: "What is GAP insurance in Canada?",
    answer: "GAP insurance covers the difference between your car's actual cash value and what you still owe on your loan if your vehicle is stolen or written off. This protects you from paying out-of-pocket for a car you no longer have.",
  },
  {
    question: "What does tire and rim protection cover?",
    answer: "It helps cover the cost of repairs or replacement for damage caused by potholes, nails, curb impact, and road hazards. This is especially valuable in Canadian cities with harsh winter conditions.",
  },
  {
    question: "Can I add protection after purchase?",
    answer: "Yes, you can add any PlanetCare protection package or individual product within 30 days of vehicle purchase. Contact our team to discuss options that fit your needs.",
  },
  {
    question: "Are PlanetCare plans transferable?",
    answer: "Yes, all PlanetCare protection packages are fully transferable to new owners, which can increase your vehicle's resale value when it's time to sell or trade in.",
  },
]

export default function ProtectionPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        {/* Hero section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">PlanetCare Protection</Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold max-w-3xl mx-auto text-balance">
              Extended Car Warranty & GAP Insurance
            </h1>
            <p className="mt-6 text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Planet Motors provides extended warranty plans, GAP insurance, and high-value protection options for used cars in Richmond Hill. Choose the package that fits your budget and requirements.
            </p>
          </div>
        </section>

        {/* Packages Comparison */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                PlanetCare Protection Packages
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                See what package fits your budget and requirements. Prices vary depending on the vehicle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-xl p-8 border relative ${
                    pkg.highlighted
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-card border-border"
                  }`}
                >
                  {pkg.badge && (
                    <Badge 
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                        pkg.highlighted ? "bg-accent text-accent-foreground" : "bg-primary"
                      }`}
                    >
                      {pkg.badge}
                    </Badge>
                  )}
                  
                  <h3 className="font-semibold text-xl mb-2 text-center">{pkg.name}</h3>
                  
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="font-serif text-4xl font-semibold">${pkg.price.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className={pkg.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}>
                        Deposit due at checkout
                      </span>
                      <span className="font-medium">${pkg.deposit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={pkg.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}>
                        Warranty
                      </span>
                      <span className="font-medium">{pkg.warranty}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground" : "text-green-600"}`} />
                      <span>Trade-in Credit Applied</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground" : "text-green-600"}`} />
                      <span>Pickup or Delivery Anytime</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {pkg.tireRim ? (
                        <CheckCircle className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground" : "text-green-600"}`} />
                      ) : (
                        <X className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground/50" : "text-muted-foreground"}`} />
                      )}
                      <span className={!pkg.tireRim ? (pkg.highlighted ? "text-primary-foreground/50" : "text-muted-foreground") : ""}>
                        Tire and Rim Protection
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {pkg.antitheft ? (
                        <CheckCircle className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground" : "text-green-600"}`} />
                      ) : (
                        <X className={`w-4 h-4 ${pkg.highlighted ? "text-primary-foreground/50" : "text-muted-foreground"}`} />
                      )}
                      <span className={!pkg.antitheft ? (pkg.highlighted ? "text-primary-foreground/50" : "text-muted-foreground") : ""}>
                        InvisiTrak Anti-Theft
                      </span>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${pkg.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {pkg.benefits}
                  </p>

                  <div className={`text-xs p-3 rounded-lg mb-6 ${
                    pkg.highlighted ? "bg-primary-foreground/10" : "bg-muted"
                  }`}>
                    <strong>Maximum Value:</strong><br />
                    {pkg.maxValue}
                  </div>

                  <Button
                    className="w-full"
                    variant={pkg.highlighted ? "secondary" : "default"}
                    size="lg"
                  >
                    Select Package
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Individual Protection Products */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Individual Protection Products
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Add standalone protection products to any vehicle purchase.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalProducts.map((product) => (
                <Card key={product.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <product.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="tel:1-866-797-3332">Learn More</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Why Choose PlanetCare
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "Comprehensive Coverage", description: "Protection from depreciation, repairs, and unforeseen events" },
                { icon: Clock, title: "Quick Claims", description: "Fast processing with direct payment to repair facilities" },
                { icon: Phone, title: "24/7 Support", description: "Our team is available around the clock to assist you" },
                { icon: Award, title: "Transferable", description: "Coverage transfers to new owners, increasing resale value" },
              ].map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-background rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Have more questions? Our team is here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button asChild>
                  <a href="tel:1-866-797-3332">Call 1-866-797-3332</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
