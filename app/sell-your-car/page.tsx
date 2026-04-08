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

export const metadata: Metadata = {
  title: 'Sell Your Car | Planet Motors',
  description: 'Get the best price for your vehicle. No hassle, no hidden fees. Get an instant offer and same-day payment.',
}

export default async function SellYourCarPage() {
  const pageData = await getSellYourCarPage()

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

  const rawRows = pageData?.comparisonRows || pageData?.comparisonTable?.rows || [
    { feature: 'Instant Offer', planetMotors: 'Yes', competitors: 'Days/Weeks' },
    { feature: 'Hidden Fees', planetMotors: 'None', competitors: 'Many' },
    { feature: 'Payment Speed', planetMotors: 'Same Day', competitors: '1-2 Weeks' },
    { feature: 'Free Pickup', planetMotors: 'Yes', competitors: 'Rarely' },
  ]
  const comparisonRows = rawRows.map((r) => ({
    feature: r.feature,
    us: 'us' in r ? (r as { feature: string; us: string; others: string }).us : (r as { feature: string; planetMotors: string; competitors: string }).planetMotors,
    others: 'others' in r ? (r as { feature: string; us: string; others: string }).others : (r as { feature: string; planetMotors: string; competitors: string }).competitors,
  }))

  const rawTestimonials = pageData?.testimonials || pageData?.testimonialsSection?.testimonials || []
  const testimonials = rawTestimonials.map((t) => ({
    name: 'name' in t ? (t as { name: string }).name : (t as { customerName: string }).customerName,
    quote: 'quote' in t ? (t as { quote: string }).quote : (t as { review: string }).review,
    rating: t.rating,
    vehiclePurchased: t.vehiclePurchased,
    location: 'location' in t ? (t as { location?: string }).location : undefined,
  }))

  const faqs = pageData?.faqs || [
    { question: 'How long does the process take?', answer: 'Most sales are completed within 24 hours from initial quote to payment.' },
    { question: 'What documents do I need?', answer: 'You will need your vehicle title, valid ID, and registration.' },
    { question: 'Do you buy cars that are not running?', answer: 'Yes! We purchase vehicles in any condition.' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
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
          title={pageData?.comparisonTitle || pageData?.comparisonTable?.sectionTitle || 'Planet Motors vs. Other Options'}
          rows={comparisonRows}
          usLabel={pageData?.comparisonTable?.ourColumnTitle || 'Planet Motors'}
          othersLabel={pageData?.comparisonTable?.othersColumnTitle || 'Private Sale / Other Dealers'}
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
          ctaText={pageData?.ctaButton?.text || pageData?.ctaSection?.ctaText || 'Get Your Offer'}
          ctaLink={pageData?.ctaButton?.url || pageData?.ctaSection?.ctaLink || '#quote-form'}
        />
      </main>
      <Footer />
    </div>
  )
}
