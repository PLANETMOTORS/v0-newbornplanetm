import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SellYourCarHero } from '@/components/sell-your-car/hero'
import { BenefitsSection } from '@/components/sell-your-car/benefits-section'
import { ProcessSteps } from '@/components/sell-your-car/process-steps'
import { ComparisonTable } from '@/components/sell-your-car/comparison-table'
import { CTASection } from '@/components/sell-your-car/cta-section'
import { FAQSection } from '@/components/sell-your-car/faq-section'
import { SellYourCarForm } from '@/components/sell-your-car/form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BreadcrumbJsonLd, FAQJsonLd, HowToJsonLd, LocalServiceJsonLd } from '@/components/seo/json-ld'
import { generateSEOMetadata } from '@/lib/seo/metadata'
import { SELL_TESLA_CITY_SLUGS, getCityData, getLocalFAQs } from '@/lib/constants/cities'
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from '@/lib/constants/dealership'
import { Shield, Zap, MapPin, Phone, Battery } from 'lucide-react'

export function generateStaticParams() {
  return SELL_TESLA_CITY_SLUGS.map((city) => ({ city }))
}

type PageProps = { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCityData(slug)
  if (!city || !city.hasTeslaPage) return {}

  return generateSEOMetadata({
    title: `Sell Your Tesla in ${city.name}, ${city.provinceShort} | Top Dollar, Aviloo Battery Expertise`,
    description: `Sell your Tesla in ${city.name} for top dollar. Planet Motors offers Aviloo battery diagnostics, same-day payment, and free pickup in ${city.name}. OMVIC licensed EV specialists since 2005.`,
    path: `/sell-your-tesla/${city.slug}`,
    keywords: city.sellTeslaKeywords,
  })
}

const processSteps = [
  { stepNumber: 1, title: 'Get Your Tesla Quote', description: 'Enter your Tesla model, year, mileage, and condition. Receive a competitive, battery-informed offer in minutes.' },
  { stepNumber: 2, title: 'Schedule Free Pickup', description: 'We come to you for a quick inspection — no trips to a dealership. Free pickup across Canada.' },
  { stepNumber: 3, title: 'Get Paid Same Day', description: 'Accept the offer and receive same-day payment via e-transfer or bank draft. We handle all paperwork.' },
]

const comparisonRows = [
  { feature: 'EV & Tesla Expertise', us: 'Dedicated EV team', others: 'Generic appraisals' },
  { feature: 'Battery Health Assessment', us: 'Aviloo-informed valuation', others: 'Not assessed' },
  { feature: 'Instant Offer', us: 'Yes — under 60 seconds', others: 'Days to weeks' },
  { feature: 'Payment Speed', us: 'Same day', others: '1-2 weeks' },
  { feature: 'Free Pickup', us: 'Canada-wide', others: 'Rarely offered' },
  { feature: 'OMVIC Licensed', us: 'Since 2005', others: 'Often unlicensed' },
]

export default async function SellYourTeslaCityPage({ params }: PageProps) {
  const { city: slug } = await params
  const city = getCityData(slug)
  if (!city || !city.hasTeslaPage) notFound()

  const faqs = getLocalFAQs(city, 'sell-tesla')
  const isLocal = city.distanceKm <= 50

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Sell Your Tesla', url: '/sell-your-tesla' },
        { name: `Sell Your Tesla in ${city.name}`, url: `/sell-your-tesla/${city.slug}` },
      ]} />
      <LocalServiceJsonLd
        name={`Tesla Acquisition Service — ${city.name}`}
        description={`Sell your Tesla in ${city.name}, ${city.province} for top dollar. Aviloo battery diagnostics, same-day payment, and free pickup. OMVIC licensed EV specialists since 2005.`}
        serviceType="Electric Vehicle Purchase"
        url={`/sell-your-tesla/${city.slug}`}
        cityName={city.name}
        province={city.province}
      />
      <HowToJsonLd
        name={`How to Sell Your Tesla in ${city.name}`}
        description={`Sell your Tesla in ${city.name} in three easy steps with Planet Motors.`}
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
                <Zap className="h-4 w-4 text-primary" />
                EV Specialists
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Battery className="h-4 w-4 text-primary" />
                Aviloo Battery Expertise
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                OMVIC Since 2005
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {city.name} Pickup
              </span>
            </div>
          </div>
        </div>

        {/* Hero + Form */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <SellYourCarHero
                headline={`Sell Your Tesla in ${city.name}`}
                subheadline={`Get top dollar for your Tesla in ${city.name}, ${city.provinceShort}. Our EV specialists use Aviloo battery diagnostics for fair, transparent pricing. Same-day payment, free pickup.`}
                highlightText="Tesla Specialists"
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* Local Context */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Tesla Sellers in {city.name} Trust Planet Motors
            </h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                {city.name}&apos;s growing Tesla community deserves a buyer who understands EV value.
                Planet Motors is Canada&apos;s go-to OMVIC-licensed dealer for Tesla acquisitions — we use Aviloo
                FLASH Test data to assess your battery&apos;s State of Health so you get a fair, transparent offer.
              </p>
              <p>
                Whether you drive a Model 3, Model Y, Model S, Model X, or Cybertruck in{' '}
                {city.landmarks.slice(0, 3).join(', ')}, we offer free pickup and same-day payment.
                {isLocal
                  ? ` Our Richmond Hill location is just ${city.distanceKm}km away — or we come to you.`
                  : ' Our nationwide logistics network covers all of ' + city.province + '.'}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <BenefitsSection
          title={`Why Sell Your Tesla to Planet Motors in ${city.name}?`}
          benefits={[
            { icon: 'Zap', title: 'EV & Tesla Expertise', description: 'Our team specializes in electric vehicles. We understand Tesla technology, battery health, and the true value of your car.' },
            { icon: 'Shield', title: 'Aviloo Battery Knowledge', description: 'We use independent Aviloo FLASH Test data to assess battery State of Health — so your Tesla is valued fairly.' },
            { icon: 'DollarSign', title: 'Top Dollar Offers', description: `We pay premium prices for Teslas in ${city.name} based on real Canadian market data. No lowball offers.` },
            { icon: 'Clock', title: 'Same-Day Payment', description: 'Accept our offer and get paid the same day by e-transfer or bank draft.' },
            { icon: 'Car', title: `Free ${city.name} Pickup`, description: `We pick up your Tesla in ${city.name} at zero cost. No trips to a dealership.` },
            { icon: 'ThumbsUp', title: 'OMVIC Licensed Since 2005', description: 'Fully licensed Ontario dealer. Transparent, regulated, and trustworthy.' },
          ]}
        />

        {/* How It Works */}
        <ProcessSteps
          title={`How to Sell Your Tesla in ${city.name}`}
          steps={processSteps}
        />

        {/* Comparison Table */}
        <ComparisonTable
          title="Planet Motors vs. Other Tesla Buyers"
          rows={comparisonRows}
          usLabel="Planet Motors"
          othersLabel="Other Buyers"
        />

        {/* FAQ */}
        <FAQSection
          title={`Selling Your Tesla in ${city.name} — FAQ`}
          faqs={faqs}
        />

        {/* Related Services */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">More Ways to Sell</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link href={`/sell-your-car/${city.slug}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-sm">Sell Any Vehicle in {city.name}</p>
                  <p className="text-xs text-muted-foreground">All makes &amp; models</p>
                </div>
              </Link>
              <Link href="/sell-your-tesla" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-sm">Sell Your Tesla (Canada)</p>
                  <p className="text-xs text-muted-foreground">Nationwide Tesla program</p>
                </div>
              </Link>
              <Link href="/free-pickup" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-bold text-sm">Free Pickup</p>
                  <p className="text-xs text-muted-foreground">Canada-wide at no cost</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-10 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-semibold mb-2">
              Ready to sell your Tesla in {city.name}?
            </p>
            <p className="text-muted-foreground mb-4">
              Call us toll-free or get your instant Tesla valuation online.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`tel:${PHONE_TOLL_FREE_TEL}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {PHONE_TOLL_FREE}
              </a>
              <Link
                href="/sell-your-tesla#quote-form"
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                Get Your Tesla Valuation
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection
          headline={`Sell Your Tesla in ${city.name} Today`}
          subheadline="EV specialists. Aviloo battery expertise. Same-day payment. Free pickup."
          ctaText="Get Your Tesla Offer"
          ctaLink="/sell-your-tesla#quote-form"
        />
      </main>
      <Footer />
    </div>
  )
}
