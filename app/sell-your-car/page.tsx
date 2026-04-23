import { getSellYourCarPage } from '@/lib/sanity/fetch'
import { SellYourCarHero } from '@/components/sell-your-car/hero'
import { BenefitsSection } from '@/components/sell-your-car/benefits-section'
import { ProcessSteps } from '@/components/sell-your-car/process-steps'
import { ComparisonTable } from '@/components/sell-your-car/comparison-table'
import { TestimonialsSection } from '@/components/sell-your-car/testimonials-section'
import { CTASection } from '@/components/sell-your-car/cta-section'
import { FAQSection } from '@/components/sell-your-car/faq-section'
import { SellYourCarForm } from '@/components/sell-your-car/form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbJsonLd, FAQJsonLd, ServiceJsonLd, HowToJsonLd } from '@/components/seo/json-ld'
import { generateSEOMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'
import { Shield, Calendar, Banknote, Truck } from 'lucide-react'
import type { SellYourCarPage as SellYourCarPageType } from '@/lib/sanity/types'

export const metadata = generateSEOMetadata({
  title: "Sell Your Car in Canada | Best Price, No Hassle",
  description: "Get the best price for your vehicle at Planet Motors. Instant offers, same-day payment, free pickup across Canada. OMVIC licensed since 2005.",
  path: "/sell-your-car",
  keywords: ["sell my car Canada", "sell car online", "instant car offer", "sell used car", "car valuation Canada", "OMVIC dealer buy car"],
})

type ComparisonRow = {
  feature: string
  us: string
  others: string
}

type TestimonialCard = {
  name: string
  quote: string
  location?: string
  rating?: number
  vehiclePurchased?: string
}

type SellYourCarPageCompat = SellYourCarPageType & {
  heroHeadline?: string
  heroSubheadline?: string
  heroHighlightText?: string
  heroImage?: string
  benefitsTitle?: string
  processTitle?: string
  comparisonTitle?: string
  testimonialsTitle?: string
  faqTitle?: string
  ctaHeadline?: string
  ctaSubheadline?: string
  ctaButton?: { text?: string; url?: string }
  whySellToUs?: {
    sectionTitle?: string
    benefitItems?: SellYourCarPageType["benefits"]
  }
  howItWorks?: {
    sectionTitle?: string
    steps?: SellYourCarPageType["processSteps"]
  }
  comparisonRows?: unknown
  testimonialsSection?: {
    sectionTitle?: string
    testimonials?: SellYourCarPageType["testimonials"]
  }
  faqs?: Array<{ question: string; answer: string }>
}

function normalizeComparisonRows(input: unknown): ComparisonRow[] {
  if (!Array.isArray(input)) return []

  return input
    .map((row): ComparisonRow | null => {
      if (!row) return null

      if (Array.isArray(row)) {
        const [feature = '', us = '', others = ''] = row
        return { feature: String(feature), us: String(us), others: String(others) }
      }

      if (typeof row === 'object') {
        const record = row as Record<string, unknown>

        if (Array.isArray(record.columns)) {
          const [feature = '', us = '', others = ''] = record.columns
          return { feature: String(feature), us: String(us), others: String(others) }
        }

        const feature = record.feature
        const us = record.us ?? record.planetMotors
        const others = record.others ?? record.competitors

        if (feature || us || others) {
          return {
            feature: String(feature ?? ''),
            us: String(us ?? ''),
            others: String(others ?? ''),
          }
        }
      }

      return null
    })
    .filter((row): row is ComparisonRow => Boolean(row))
}

function normalizeTestimonials(input: unknown): TestimonialCard[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item): TestimonialCard | null => {
      if (!item || typeof item !== "object") return null

      const record = item as Record<string, unknown>
      const name = record.name ?? record.customerName
      const quote = record.quote ?? record.review

      if (!name || !quote) return null

      return {
        name: String(name),
        quote: String(quote),
        location: typeof record.location === "string" ? record.location : undefined,
        rating: typeof record.rating === "number" ? record.rating : undefined,
        vehiclePurchased: typeof record.vehiclePurchased === "string" ? record.vehiclePurchased : undefined,
      }
    })
    .filter((item): item is TestimonialCard => Boolean(item))
}

export default async function SellYourCarPage() {
  const pageData = await getSellYourCarPage() as SellYourCarPageCompat | null

  // Default content if CMS data is not available
  const heroContent = {
    headline: pageData?.heroHeadline || pageData?.heroSection?.headline || 'Sell Your Car Today',
    subheadline: pageData?.heroSubheadline || pageData?.heroSection?.subheadline || 'Get a competitive offer in minutes. No haggling, no hidden fees.',
    highlightText: pageData?.heroHighlightText || pageData?.heroSection?.highlightText || '+$500 Bonus',
    backgroundImage: pageData?.heroImage || pageData?.heroSection?.backgroundImage,
  }

  const benefits = pageData?.benefits || pageData?.whySellToUs?.benefitItems || [
    { icon: 'DollarSign', title: 'Top Dollar Offers', description: 'We pay premium prices for quality vehicles' },
    { icon: 'Clock', title: 'Same-Day Payment', description: 'Get paid the same day you sell' },
    { icon: 'Shield', title: 'No Hidden Fees', description: 'The price we quote is the price you get' },
    { icon: 'Car', title: 'Free Pickup', description: 'We come to you at no extra cost' },
  ]

  const processSteps = pageData?.processSteps || pageData?.howItWorks?.steps || [
    { stepNumber: 1, title: 'Get Your Quote', description: 'Fill out our simple form or call us for an instant quote' },
    { stepNumber: 2, title: 'Schedule Inspection', description: 'We come to you for a quick 15-minute inspection' },
    { stepNumber: 3, title: 'Get Paid', description: 'Accept the offer and get paid same day' },
  ]

  const normalizedComparisonRows = normalizeComparisonRows(pageData?.comparisonRows || pageData?.comparisonTable?.rows)
  const comparisonRows = normalizedComparisonRows.length > 0 ? normalizedComparisonRows : [
    { feature: 'Instant Offer', us: 'Yes', others: 'Days/Weeks' },
    { feature: 'Hidden Fees', us: 'None', others: 'Many' },
    { feature: 'Payment Speed', us: 'Same Day', others: '1-2 Weeks' },
    { feature: 'Free Pickup', us: 'Yes', others: 'Rarely' },
  ]

  const testimonialsRaw = pageData?.testimonials || pageData?.testimonialsSection?.testimonials || []
  const testimonials = normalizeTestimonials(testimonialsRaw)

  const faqs = pageData?.faqs || [
    { question: 'How long does the process take?', answer: 'Most sales are completed within 24 hours from initial quote to payment.' },
    { question: 'What documents do I need?', answer: 'You will need your vehicle title, valid ID, and registration.' },
    { question: 'Do you buy cars that are not running?', answer: 'Yes! We purchase vehicles in any condition.' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Sell Your Car", url: "/sell-your-car" }]} />
      <ServiceJsonLd
        name="Vehicle Acquisition Service"
        description="Sell your car to Planet Motors for the best price in Canada. Instant offers, same-day payment, and free pickup across Canada. OMVIC licensed dealer since 2005."
        serviceType="Vehicle Purchase"
        url="/sell-your-car"
      />
      <HowToJsonLd
        name="How to Sell Your Car to Planet Motors"
        description="Sell your vehicle in three easy steps with Planet Motors."
        steps={processSteps.map(s => ({ title: s.title, description: s.description }))}
      />
      <FAQJsonLd faqs={faqs} />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Trust Chip Bar */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                OMVIC Licensed
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Since 2005
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-primary" />
                Same-Day Payment
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                Free Canada-Wide Pickup
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section with Form */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <SellYourCarHero
                headline={heroContent.headline}
                subheadline={heroContent.subheadline}
                highlightText={heroContent.highlightText}
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <BenefitsSection
          title={pageData?.benefitsTitle || pageData?.whySellToUs?.sectionTitle || 'Why Sell to Planet Motors?'}
          benefits={benefits}
        />

        {/* How It Works */}
        <ProcessSteps
          title={pageData?.processTitle || pageData?.howItWorks?.sectionTitle || 'How It Works'}
          steps={processSteps}
        />

        {/* Comparison Table */}
        <ComparisonTable
          title={pageData?.comparisonTitle || pageData?.comparisonTable?.headline || 'Planet Motors vs. Other Options'}
          rows={comparisonRows}
          usLabel={(pageData?.comparisonTable as { ourColumnTitle?: string; planetMotorsLabel?: string } | undefined)?.ourColumnTitle || (pageData?.comparisonTable as { ourColumnTitle?: string; planetMotorsLabel?: string } | undefined)?.planetMotorsLabel || 'Planet Motors'}
          othersLabel={(pageData?.comparisonTable as { othersColumnTitle?: string; othersLabel?: string } | undefined)?.othersColumnTitle || (pageData?.comparisonTable as { othersColumnTitle?: string; othersLabel?: string } | undefined)?.othersLabel || 'Private Sale / Other Dealers'}
        />

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <TestimonialsSection
            title={pageData?.testimonialsTitle || pageData?.testimonialsSection?.sectionTitle || 'What Our Sellers Say'}
            testimonials={testimonials}
          />
        )}

        {/* FAQ */}
        <FAQSection
          title={pageData?.faqTitle || 'Frequently Asked Questions'}
          faqs={faqs}
        />

        {/* Related Services */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Related Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link
                href="/sell-your-tesla"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-sm">Sell Your Tesla</p>
                  <p className="text-xs text-muted-foreground">Top dollar for Tesla vehicles</p>
                </div>
              </Link>
              <Link
                href="/we-buy-cars"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">🏷️</span>
                <div>
                  <p className="font-bold text-sm">We Buy Cars</p>
                  <p className="text-xs text-muted-foreground">Instant cash offers, any make or model</p>
                </div>
              </Link>
              <Link
                href="/free-pickup"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-bold text-sm">Free Pickup</p>
                  <p className="text-xs text-muted-foreground">We come to you — anywhere in Canada</p>
                </div>
              </Link>
              <Link
                href="/trade-in"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-bold text-sm">Trade-In Valuation</p>
                  <p className="text-xs text-muted-foreground">Get your vehicle&apos;s trade-in value</p>
                </div>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-sm">Browse Inventory</p>
                  <p className="text-xs text-muted-foreground">Shop our certified pre-owned vehicles</p>
                </div>
              </Link>
              <Link
                href="/financing"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-bold text-sm">Financing Options</p>
                  <p className="text-xs text-muted-foreground">Competitive rates from 20+ lenders</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          headline={pageData?.ctaHeadline || pageData?.ctaSection?.headline || 'Ready to Sell Your Car?'}
          subheadline={pageData?.ctaSubheadline || pageData?.ctaSection?.subheadline || 'Get your free, no-obligation quote in minutes'}
          ctaText={pageData?.ctaButton?.text || pageData?.ctaSection?.buttonLabel || 'Get Your Offer'}
          ctaLink={pageData?.ctaButton?.url || pageData?.ctaSection?.buttonUrl || '#quote-form'}
        />
      </main>
      <Footer />
    </div>
  )
}
