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
import { SELL_CAR_CITY_SLUGS, getCityData, getLocalFAQs } from '@/lib/constants/cities'
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from '@/lib/constants/dealership'
import { Shield, Calendar, Banknote, MapPin, Phone } from 'lucide-react'

export function generateStaticParams() {
  return SELL_CAR_CITY_SLUGS.map((city) => ({ city }))
}

type PageProps = { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCityData(slug)
  if (!city) return {}

  return generateSEOMetadata({
    title: `Sell Your Car in ${city.name}, ${city.provinceShort} | Best Price, Free Pickup`,
    description: `Sell your car in ${city.name} for the best price. Planet Motors offers instant valuations, same-day payment, and free pickup in ${city.name} and across ${city.province}. OMVIC licensed since 2005.`,
    path: `/sell-your-car/${city.slug}`,
    keywords: city.sellCarKeywords,
  })
}

const processSteps = [
  { stepNumber: 1, title: 'Get Your Quote', description: 'Enter your vehicle details online for an instant valuation — takes under 60 seconds.' },
  { stepNumber: 2, title: 'Schedule Free Pickup', description: 'Book a convenient time for our team to inspect and collect your vehicle at no cost.' },
  { stepNumber: 3, title: 'Get Paid Same Day', description: 'Accept your offer and receive same-day payment via e-transfer or bank draft.' },
]

const comparisonRows = [
  { feature: 'Instant Offer', us: 'Yes — under 60 seconds', others: 'Days to weeks' },
  { feature: 'Hidden Fees', us: 'None — ever', others: 'Listing, transaction fees' },
  { feature: 'Payment Speed', us: 'Same day', others: '1-2 weeks' },
  { feature: 'Free Pickup', us: 'Canada-wide', others: 'Rarely offered' },
  { feature: 'Paperwork', us: 'We handle everything', others: 'DIY' },
  { feature: 'Safety Risk', us: 'Zero — OMVIC licensed', others: 'Stranger meetings' },
]

export default async function SellYourCarCityPage({ params }: PageProps) {
  const { city: slug } = await params
  const city = getCityData(slug)
  if (!city) notFound()

  const faqs = getLocalFAQs(city, 'sell-car')
  const isLocal = city.distanceKm <= 50

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Sell Your Car', url: '/sell-your-car' },
        { name: `Sell Your Car in ${city.name}`, url: `/sell-your-car/${city.slug}` },
      ]} />
      <LocalServiceJsonLd
        name={`Vehicle Acquisition Service — ${city.name}`}
        description={`Sell your car in ${city.name}, ${city.province} for the best price. Instant offers, same-day payment, and free pickup. OMVIC licensed dealer since 2005.`}
        serviceType="Vehicle Purchase"
        url={`/sell-your-car/${city.slug}`}
        cityName={city.name}
        province={city.province}
      />
      <HowToJsonLd
        name={`How to Sell Your Car in ${city.name}`}
        description={`Sell your vehicle in ${city.name} in three easy steps with Planet Motors.`}
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
                headline={`Sell Your Car in ${city.name}`}
                subheadline={`Get the best price for your vehicle in ${city.name}, ${city.provinceShort}. Instant online valuation, same-day payment, and free pickup — no haggling, no hidden fees.`}
                highlightText={isLocal ? 'Local Pickup' : 'Free Nationwide Pickup'}
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* Local Context Section */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Why {city.name} Residents Choose Planet Motors
            </h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                Selling your car in {city.name} has never been easier. Planet Motors is an OMVIC-licensed dealer
                that has been buying vehicles across Canada since 2005. Whether you&apos;re in{' '}
                {city.landmarks.slice(0, 3).join(', ')} or anywhere in {city.name}, we come to you.
              </p>
              {isLocal ? (
                <p>
                  Our dealership in Richmond Hill is just {city.distanceKm > 0 ? `${city.distanceKm}km` : 'minutes'} away
                  — drive in for same-day payment or schedule a free pickup at your convenience.
                </p>
              ) : (
                <p>
                  Even though we&apos;re based in Richmond Hill, Ontario, our free nationwide pickup service means
                  {city.name} sellers get the same fast, hassle-free experience. We arrange secure transport and pay you
                  the moment the vehicle is collected.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <BenefitsSection
          title={`Why Sell Your Car to Planet Motors in ${city.name}?`}
          benefits={[
            { icon: 'DollarSign', title: 'Top Dollar Offers', description: `We pay premium prices for vehicles in ${city.name} — often above market value for clean, in-demand models.` },
            { icon: 'Clock', title: 'Same-Day Payment', description: 'Accept your offer and get paid the same day. No waiting, no delays.' },
            { icon: 'Shield', title: 'OMVIC Licensed Since 2005', description: 'Deal with a trusted, government-licensed dealer — not a random buyer.' },
            { icon: 'Car', title: `Free ${city.name} Pickup`, description: `We pick up your vehicle in ${city.name} at zero cost. You don't lift a finger.` },
          ]}
        />

        {/* How It Works */}
        <ProcessSteps
          title={`How to Sell Your Car in ${city.name}`}
          steps={processSteps}
        />

        {/* Comparison Table */}
        <ComparisonTable
          title={`Planet Motors vs. Selling Privately in ${city.name}`}
          rows={comparisonRows}
          usLabel="Planet Motors"
          othersLabel="Private Sale / Other Dealers"
        />

        {/* FAQ */}
        <FAQSection
          title={`Selling Your Car in ${city.name} — FAQ`}
          faqs={faqs}
        />

        {/* Related Services + Internal Linking */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">More Ways to Sell</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Link href="/sell-your-car" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-sm">Sell Any Vehicle</p>
                  <p className="text-xs text-muted-foreground">All makes &amp; models</p>
                </div>
              </Link>
              {city.hasTeslaPage && (
                <Link href={`/sell-your-tesla/${city.slug}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-bold text-sm">Sell Your Tesla</p>
                    <p className="text-xs text-muted-foreground">EV expertise in {city.name}</p>
                  </div>
                </Link>
              )}
              <Link href="/we-buy-cars" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="text-2xl">💵</span>
                <div>
                  <p className="font-bold text-sm">We Buy Cars</p>
                  <p className="text-xs text-muted-foreground">Instant cash offers</p>
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
              Ready to sell your car in {city.name}?
            </p>
            <p className="text-muted-foreground mb-4">
              Call us toll-free or get your instant online quote.
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
                href="/sell-your-car#quote-form"
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                Get Your Free Quote
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          headline={`Sell Your Car in ${city.name} Today`}
          subheadline={`Join thousands of ${city.province} sellers who chose Planet Motors. Free quote in 60 seconds.`}
          ctaText="Get Your Offer"
          ctaLink="/sell-your-car#quote-form"
        />
      </main>
      <Footer />
    </div>
  )
}
