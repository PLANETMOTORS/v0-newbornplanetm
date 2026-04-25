import { Metadata } from 'next'
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
import { BreadcrumbJsonLd } from '@/components/seo/json-ld'
import type { SellYourCarPage as SellYourCarPageType } from '@/lib/sanity/types'

export const metadata: Metadata = {
  title: 'Sell Your Car | Planet Motors',
  description: 'Get the best price for your vehicle. No hassle, no hidden fees. Get an instant offer and same-day payment.',
  alternates: {
    canonical: '/sell-your-car',
  },
}

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
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section with Form */}
        <section className="relative bg-linear-to-br from-primary/10 via-background to-background">
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
