import Link from "next/link"
import {
  Shield, Phone, Clock, Award, FileText, Car, LockKeyhole, PaintBucket,
  Sparkles, Droplets, CircleDot, Wrench, MapPin, RotateCcw, Headphones, ArrowRight,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ComparisonTableWrapper } from "./comparison-table-wrapper"
import { ProductDetailsSection } from "./product-details-section"

export const metadata = {
  title: "PlanetCare Protection Packages | Planet Motors",
  description: "Personalized protection when you buy from Planet Motors. Compare Essential, Certified, and Certified Plus packages with extended warranty, GAP insurance, tire & rim, and rust protection.",
  openGraph: {
    title: "PlanetCare Protection Packages | Planet Motors",
    description: "Compare Essential, Certified, and Certified Plus protection packages with extended warranty, GAP insurance, tire & rim, and rust protection.",
    url: "https://www.planetmotors.ca/protection-plans",
  },
  alternates: {
    canonical: "https://www.planetmotors.ca/protection-plans",
  },
}

const trustBadges = [
  { icon: MapPin, label: "Any Licensed Shop", sublabel: "Canada-wide" },
  { icon: Headphones, label: "24/7 Roadside", sublabel: "Assistance" },
  { icon: RotateCcw, label: "Transferable", sublabel: "To new owners" },
  { icon: Shield, label: "Cancel Anytime", sublabel: "Hassle-free" },
]

const additionalProducts = [
  { name: "Companion GAP Coverage", description: "Covers the difference between your car's value and what you owe if it's totaled or stolen.", icon: Shield, slug: "gap-coverage" },
  { name: "Extended Vehicle Warranty", description: "Comprehensive mechanical breakdown protection after manufacturer warranty expires.", icon: FileText, slug: "extended-warranty" },
  { name: "IncidentPro", description: "Protection against accidents, theft, and total loss events with fast claims processing.", icon: Car, slug: "incident-pro" },
  { name: "InvisiTrak Anti-Theft System", description: "GPS tracking and theft recovery system with 24/7 monitoring and mobile alerts.", icon: LockKeyhole, slug: "anti-theft" },
  { name: "Paint Protection Film", description: "Clear protective film that shields your paint from chips, scratches, and UV damage.", icon: PaintBucket, slug: "paint-protection" },
  { name: "Replacement Warranty Plan", description: "New-for-old vehicle replacement if your car is written off within coverage period.", icon: Sparkles, slug: "replacement-warranty" },
  { name: "Rust Protection Coating", description: "Professional-grade undercoating to prevent rust and corrosion from Canadian winters.", icon: Droplets, slug: "rust-protection" },
  { name: "Tire and Rim Protection", description: "Coverage for damage from potholes, nails, curb impact, and road hazards.", icon: CircleDot, slug: "tire-rim-protection" },
  { name: "Window Tint Film", description: "Premium window tinting for UV protection, privacy, and heat reduction.", icon: Wrench, slug: "window-tint" },
]

const faqs = [
  { question: "Is an extended warranty on a used car worth it?", answer: "Yes — an extended warranty can help protect you from costly repairs after the manufacturer warranty expires, especially on pre-owned vehicles. The average major repair costs $1,500–$4,000, making coverage a smart investment." },
  { question: "What is GAP insurance in Canada?", answer: "GAP insurance covers the difference between your car's actual cash value and what you still owe on your loan if your vehicle is stolen or written off. This protects you from paying out-of-pocket for a car you no longer have." },
  { question: "What does tire and rim protection cover?", answer: "It covers the cost of repairs or replacement for damage caused by potholes, nails, curb impact, and road hazards. This is especially valuable in Canadian cities with harsh winter conditions." },
  { question: "Can I add protection after purchase?", answer: "Yes, you can add any PlanetCare protection package or individual product within 30 days of vehicle purchase. Contact our team to discuss options that fit your needs." },
  { question: "Are PlanetCare plans transferable?", answer: "Yes, all PlanetCare protection packages are fully transferable to new owners, which can increase your vehicle's resale value when it's time to sell or trade in." },
  { question: "What if I pay cash — can I still get protection?", answer: "Absolutely. Our Essential and Certified packages are available for both cash and finance buyers. The Certified Plus™ package is exclusively for finance customers as the additional coverages are bundled with loan protection." },
]

export default function ProtectionPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="pt-24 pb-20">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/3 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 text-xs tracking-wider uppercase px-4 py-1.5 shadow-lg">
              PlanetCare Protection
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold max-w-4xl mx-auto text-balance leading-tight">
              Drive with confidence.{" "}
              <span className="text-primary-foreground/90">We&apos;ve got you covered.</span>
            </h1>
            <p className="mt-6 text-primary-foreground/70 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
              Personalized protection packages with extended warranty, GAP insurance, and more — designed for every budget and every driver.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold shadow-lg" asChild>
                <a href="#compare">Compare Packages</a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-white/60 text-white bg-white/10 hover:bg-white/20" asChild>
                <a href="tel:1-866-797-3332">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════ TRUST BAR ═══════════ */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {trustBadges.map((badge) => (
                <div key={badge.label} className="flex items-center justify-center gap-3 py-5 md:py-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <badge.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm leading-tight">{badge.label}</div>
                    <div className="text-xs text-muted-foreground">{badge.sublabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ COMPARISON TABLE ═══════════ */}
        <section id="compare" className="py-16 lg:py-24 scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 text-xs">Choose Your Package</Badge>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold">
                Compare Protection Packages
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
                Every vehicle includes our 150+ point inspection and safety certificate.
                Choose a package to unlock additional protection.
              </p>
            </div>

            <ComparisonTableWrapper />

            <p className="text-center text-xs text-muted-foreground mt-6">
              Prices vary by vehicle. All packages include our 10-day money-back guarantee.
            </p>
          </div>
        </section>


        {/* ═══════════ INDIVIDUAL PRODUCTS ═══════════ */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-xs">À La Carte</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold">
                Individual Protection Products
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Customize your coverage with standalone products — available with any vehicle purchase.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {additionalProducts.map((product) => (
                <Card key={product.name} className="group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors">
                        <product.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{product.description}</p>
                        <a
                          href={`#product-${product.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Learn more about {product.name} <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ WHY PLANETCARE ═══════════ */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl md:text-4xl font-bold">
                Why Choose PlanetCare
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Industry-leading protection backed by Planet Motors.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "Comprehensive Coverage", description: "Protection from depreciation, repairs, and unforeseen events with $0 deductible options" },
                { icon: Clock, title: "Quick Claims", description: "Fast processing with direct payment to any licensed repair facility across Canada" },
                { icon: Phone, title: "24/7 Support", description: "Round-the-clock roadside assistance and dedicated claims support line" },
                { icon: Award, title: "Fully Transferable", description: "Coverage transfers to new owners, increasing your vehicle's resale value" },
              ].map((benefit) => (
                <div key={benefit.title} className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 group-hover:bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-105">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PRODUCT DETAILS (INLINE ACCORDION) ═══════════ */}
        <ProductDetailsSection />

        {/* ═══════════ FAQ ═══════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-xs">FAQ</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-background rounded-xl p-6 border border-border hover:border-primary/20 transition-colors">
                  <h3 className="font-semibold mb-2 text-sm">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <p className="text-muted-foreground mb-5">
                Have more questions? Our protection specialists are here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button size="lg" asChild>
                  <a href="tel:1-866-797-3332">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 1-866-797-3332
                  </a>
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