import Link from "next/link"
import Script from "next/script"
import {
  Shield, Phone, Clock, Award, MapPin, RotateCcw, Headphones,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ComparisonTableWrapper } from "./comparison-table-wrapper"
import { ProductsGridWithDetails } from "./products-grid-with-details"
import { ProtectionFaqAccordion } from "./protection-faq-accordion"
import { PROTECTION_PRODUCTS } from "@/lib/protection-products"
import { getPublicSiteUrl } from "@/lib/site-url"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

const siteUrl = getPublicSiteUrl()

export const metadata = {
  title: "Vehicle Protection Plans | Warranty Coverage | Planet Motors",
  description: "Drive with peace of mind. Explore our 5-year mechanical breakdown protection and warranty plans designed specifically for Canadian drivers.",
  keywords: "vehicle protection plans, extended warranty, GAP insurance, tire and rim protection, Planet Motors warranty",
  openGraph: {
    title: "Vehicle Protection Plans | Warranty Coverage | Planet Motors",
    description: "Bumper-to-bumper warranty coverage starting from $1,950. Compare Essential, Certified, and Certified Plus packages.",
    url: `${siteUrl}/protection-plans`,
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
    images: [
      {
        url: `${siteUrl}/og-protection-plans.jpg`,
        width: 1200,
        height: 630,
        alt: "PlanetCare Vehicle Protection Plans — Planet Motors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Vehicle Protection Plans | Planet Motors",
    description: "Bumper-to-bumper warranty from $29/month. Zero-deductible options available.",
  },
  alternates: {
    canonical: "/protection-plans",
  },
}

const trustBadges = [
  { icon: MapPin, label: "Any Licensed Shop", sublabel: "Canada-wide" },
  { icon: Headphones, label: "24/7 Roadside", sublabel: "Assistance" },
  { icon: RotateCcw, label: "Transferable", sublabel: "To new owners" },
  { icon: Shield, label: "Cancel Anytime", sublabel: "Hassle-free" },
]



const faqs = [
  { question: "Is an extended warranty on a used car worth it?", answer: "Yes — an extended warranty can help protect you from costly repairs after the manufacturer warranty expires, especially on pre-owned vehicles. The average major repair costs $1,500–$4,000, making coverage a smart investment." },
  { question: "What is GAP insurance in Canada?", answer: "GAP insurance covers the difference between your car's actual cash value and what you still owe on your loan if your vehicle is stolen or written off. This protects you from paying out-of-pocket for a car you no longer have." },
  { question: "What does tire and rim protection cover?", answer: "It covers the cost of repairs or replacement for damage caused by potholes, nails, curb impact, and road hazards. This is especially valuable in Canadian cities with harsh winter conditions." },
  { question: "Can I add protection after purchase?", answer: "Yes, you can add any PlanetCare protection package or individual product within 30 days of vehicle purchase. Contact our team to discuss options that fit your needs." },
  { question: "Are PlanetCare plans transferable?", answer: "Yes, all PlanetCare protection packages are fully transferable to new owners, which can increase your vehicle's resale value when it's time to sell or trade in." },
  { question: "What if I pay cash — can I still get protection?", answer: "Absolutely. Our Essential and Certified packages are available for both cash and finance buyers. The Certified Plus™ package is exclusively for finance customers as the additional coverages are bundled with loan protection." },
]

/* ── JSON-LD Structured Data for SEO ── */
function ProtectionPlansJsonLd() {
  const siteUrl = getPublicSiteUrl()

  // FAQPage schema — aggregates all general + product FAQs for rich results
  const allFaqEntries = [
    ...faqs,
    ...PROTECTION_PRODUCTS.flatMap((p) => p.faqs),
  ]
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqEntries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  // Service schema — one entry per product for Google Service rich results
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PlanetCare Protection Products",
    itemListElement: PROTECTION_PRODUCTS.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: product.name,
        description: product.heroDescription,
        url: `${siteUrl}/protection-plans#product-${product.slug}`,
        provider: {
          "@type": "AutoDealer",
          name: "Planet Motors",
          url: siteUrl,
        },
        areaServed: { "@type": "Country", name: "Canada" },
      },
    })),
  }

  return (
    <>
      <Script id="protection-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="protection-services-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
    </>
  )
}

export default function ProtectionPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProtectionPlansJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Protection Plans", url: "/protection-plans" }]} />
      <Header />

      <main id="main-content" tabIndex={-1} className="pt-24 pb-20">
        {/* ═══════════ BREADCRUMB ═══════════ */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Protection Plans</span>
          </nav>
        </div>

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative py-20 lg:py-28 bg-linear-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] max-w-4xl mx-auto text-balance leading-tight">
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
                <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Compare Protection Packages
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
                Every vehicle includes our 150+ point inspection and safety certificate.
                Choose a package for added peace-of-mind coverage.
              </p>
            </div>

            <ComparisonTableWrapper />

            <p className="text-center text-xs text-muted-foreground mt-6">
              Prices vary by vehicle. All packages include our 10-day money-back guarantee.
            </p>
          </div>
        </section>


        {/* ═══════════ INDIVIDUAL PRODUCTS (click to expand details inline) ═══════════ */}
        <ProductsGridWithDetails />

        {/* ═══════════ WHY PLANETCARE ═══════════ */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold">
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

        {/* ═══════════ FAQ ═══════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-xs tracking-wider uppercase">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-muted-foreground">
                Common questions about PlanetCare protection coverage.
              </p>
            </div>

            <ProtectionFaqAccordion faqs={faqs} />

            <div className="mt-14 text-center">
              <p className="text-muted-foreground mb-5">
                Have more questions? Our protection specialists are here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button size="lg" asChild>
                  <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call {PHONE_TOLL_FREE}
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