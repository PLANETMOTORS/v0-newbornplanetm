import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { generateSEOMetadata } from '@/lib/seo/metadata'
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
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld'
import { getPublicSiteUrl } from '@/lib/site-url'
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL, DEALERSHIP_LOCATION } from '@/lib/constants/dealership'
import {
  Shield, MapPin, Car, Truck, Crown, Zap, Clock as ClockIcon, Award
} from 'lucide-react'

// ─── SEO Metadata ──────────────────────────────────────────────
export const metadata: Metadata = generateSEOMetadata({
  title: 'We Buy Cars Across Canada | Instant Cash Offers',
  description:
    'Planet Motors buys any make or model across Canada. Get an instant cash offer, same-day payment, and free pickup. OMVIC licensed since 2005.',
  path: '/we-buy-cars',
  keywords: [
    'we buy cars Canada',
    'sell car online Canada',
    'instant cash offer car',
    'sell my car fast',
    'car buyer Canada',
  ],
})

// ─── Static Content ────────────────────────────────────────────

const benefits = [
  { icon: 'DollarSign', title: 'Instant Cash Offers', description: 'Get a competitive offer in minutes — no waiting, no lowball quotes.' },
  { icon: 'Clock', title: 'Same-Day Payment', description: 'Accept your offer and get paid the very same day via e-transfer or cheque.' },
  { icon: 'Shield', title: 'Zero Hidden Fees', description: 'The price we quote is the price you receive. No deductions, no surprises.' },
  { icon: 'Car', title: 'Free Pickup Canada-Wide', description: 'We arrange complimentary vehicle pickup from your door — coast to coast.' },
  { icon: 'Zap', title: 'No Repairs Needed', description: 'Sell as-is. We buy vehicles in any condition — running or not.' },
  { icon: 'ThumbsUp', title: 'OMVIC Licensed Dealer', description: 'We are a fully licensed Ontario dealer — your transaction is protected by law.' },
]

const processSteps = [
  { stepNumber: 1, title: 'Get Your Instant Quote', description: "Fill out our simple online form with your vehicle details — VIN, mileage, and condition. You'll receive a no-obligation cash offer within minutes." },
  { stepNumber: 2, title: 'Accept & Schedule Pickup', description: 'Happy with your offer? Accept it and schedule a convenient pickup time. Our team comes to you anywhere in Canada at no extra cost.' },
  { stepNumber: 3, title: 'Get Paid Same Day', description: "We inspect the vehicle, handle all the paperwork, and pay you on the spot via e-transfer or certified cheque. It's that simple." },
]

const comparisonRows = [
  { feature: 'Instant Cash Offer', us: '✓ Minutes', others: '3–7 Days' },
  { feature: 'Free Pickup', us: '✓ Canada-Wide', others: 'Rarely / Extra Fee' },
  { feature: 'Hidden Fees', us: '✓ None', others: 'Admin / Processing Fees' },
  { feature: 'Payment Speed', us: '✓ Same Day', others: '5–14 Business Days' },
  { feature: 'Buy Any Condition', us: '✓ Running or Not', others: 'Running Only' },
  { feature: 'OMVIC Licensed', us: '✓ Yes', others: 'Often Not' },
  { feature: 'Paperwork Handled', us: '✓ Full Service', others: 'DIY / Partial' },
]

const testimonials = [
  { name: 'Sarah M.', location: 'Toronto, ON', quote: 'I got $3,000 more than what CarMax offered. The whole process took less than two hours from quote to payment. Highly recommend!', rating: 5, vehiclePurchased: '2020 Honda Civic' },
  { name: 'James L.', location: 'Vancouver, BC', quote: 'Sold my truck without leaving my driveway. They picked it up and paid me same day. Couldn\'t be easier.', rating: 5, vehiclePurchased: '2019 Ford F-150' },
  { name: 'Priya K.', location: 'Calgary, AB', quote: 'The offer was fair and transparent — no hidden deductions. I\'ve sold three cars to Planet Motors now.', rating: 5, vehiclePurchased: '2021 Toyota RAV4' },
]

const faqs = [
  { question: 'What types of vehicles do you buy?', answer: 'We buy all makes and models including sedans, SUVs, trucks, minivans, luxury vehicles, electric vehicles, hybrids, and classics. We also purchase vehicles that are not running or have mechanical issues.' },
  { question: 'How do I get an instant offer for my car?', answer: 'Simply fill out our online form with your vehicle\'s details — make, model, year, mileage, and condition. You\'ll receive a competitive cash offer within minutes. No obligation, no pressure.' },
  { question: 'Is there any cost or obligation to get a quote?', answer: 'Absolutely not. Our quotes are 100% free with zero obligation. If you don\'t like the offer, you can simply walk away.' },
  { question: 'How quickly can I get paid?', answer: 'We offer same-day payment in most cases. Once you accept the offer and we verify the vehicle, payment is issued immediately via e-transfer or certified cheque.' },
  { question: 'Do you buy cars that are not running?', answer: 'Yes! We purchase vehicles in any condition — running, not running, accident-damaged, high mileage, or even vehicles with mechanical issues. Get your free quote today.' },
  { question: 'Is Planet Motors a licensed dealer?', answer: 'Yes. Planet Motors is a fully licensed dealer registered with the Ontario Motor Vehicle Industry Council (OMVIC). Your transaction is protected by consumer protection laws.' },
  { question: 'Do I need to bring my car to you?', answer: 'No. We offer free pickup anywhere in Canada. Our team will come to your location at a time that works for you.' },
  { question: 'What documents do I need to sell my car?', answer: 'You will need your vehicle ownership (title), a valid government-issued photo ID, and your vehicle registration. If there is a lien on the vehicle, we can help coordinate the payoff.' },
  { question: 'Can I sell a car that still has a loan on it?', answer: 'Yes. We work with you and your lender to pay off the remaining balance. If your vehicle is worth more than the loan, you receive the difference.' },
  { question: 'How is the offer price determined?', answer: 'Our offers are based on current Canadian market data, vehicle condition, mileage, accident history, and demand. We use Canadian Black Book and real-time auction data to ensure a fair price.' },
  { question: 'Do you buy leased vehicles?', answer: 'In many cases, yes. If your lease allows a buyout, we can facilitate the purchase. Contact us with your lease details for a customized quote.' },
  { question: 'How does Planet Motors compare to selling privately?', answer: 'Selling privately can take weeks or months, involves advertising costs, test drives with strangers, and potential scams. With Planet Motors, you get an instant offer, no tire-kickers, free pickup, and same-day payment — all hassle-free.' },
  { question: 'What areas do you serve?', answer: 'We buy cars across all of Canada. Whether you\'re in Toronto, Vancouver, Montreal, Calgary, Ottawa, Halifax, or a smaller town — we offer free pickup and same-day payment nationwide.' },
  { question: 'Can I sell a car that has been in an accident?', answer: 'Yes. We buy accident-damaged vehicles. Just be transparent about the vehicle\'s history and we\'ll provide you with a fair offer based on its current condition.' },
  { question: 'How long is the offer valid?', answer: 'Our cash offers are typically valid for 7 days. Market conditions can change, so we recommend acting quickly to lock in your price.' },
]

const cities = [
  { name: 'Toronto', province: 'ON' },
  { name: 'Vancouver', province: 'BC' },
  { name: 'Montreal', province: 'QC' },
  { name: 'Calgary', province: 'AB' },
  { name: 'Ottawa', province: 'ON' },
  { name: 'Edmonton', province: 'AB' },
  { name: 'Mississauga', province: 'ON' },
  { name: 'Winnipeg', province: 'MB' },
  { name: 'Halifax', province: 'NS' },
  { name: 'Brampton', province: 'ON' },
  { name: 'Hamilton', province: 'ON' },
  { name: 'Surrey', province: 'BC' },
  { name: 'Kitchener', province: 'ON' },
  { name: 'London', province: 'ON' },
  { name: 'Victoria', province: 'BC' },
  { name: 'Richmond Hill', province: 'ON' },
]

const vehicleTypes = [
  { icon: Car, label: 'Sedans & Coupes' },
  { icon: Truck, label: 'Trucks & Pickups' },
  { icon: Car, label: 'SUVs & Crossovers' },
  { icon: Crown, label: 'Luxury Vehicles' },
  { icon: Zap, label: 'Electric & Hybrid' },
  { icon: ClockIcon, label: 'Classic & Vintage' },
]

const SITE_URL = getPublicSiteUrl()

// ─── JSON-LD Structured Data ───────────────────────────────────

function ServiceJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "We Buy Cars — Planet Motors Vehicle Acquisition",
    "description":
      "Planet Motors buys any make or model across Canada. Instant cash offers, same-day payment, and free pickup. OMVIC licensed dealer.",
    "url": `${SITE_URL}/we-buy-cars`,
    "provider": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": SITE_URL,
      "@id": `${SITE_URL}/#organization`,
    },
    "areaServed": { "@type": "Country", "name": "Canada" },
    "serviceType": "Vehicle Acquisition",
    "telephone": PHONE_TOLL_FREE_TEL,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": DEALERSHIP_LOCATION.streetAddress,
      "addressLocality": DEALERSHIP_LOCATION.city,
      "addressRegion": DEALERSHIP_LOCATION.province,
      "postalCode": DEALERSHIP_LOCATION.postalCode,
      "addressCountry": DEALERSHIP_LOCATION.country,
    },
  }
  return (
    <Script
      id="service-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function HowToJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Sell Your Car to Planet Motors",
    "description":
      "Sell your car in three easy steps: get an instant quote, schedule free pickup, and get paid same day.",
    "step": processSteps.map((s) => ({
      "@type": "HowToStep",
      "position": s.stepNumber,
      "name": s.title,
      "text": s.description,
    })),
  }
  return (
    <Script
      id="howto-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Page Component ────────────────────────────────────────────

export default function WeBuyCarsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'We Buy Cars', url: '/we-buy-cars' }]} />
      <FAQJsonLd faqs={faqs} />
      <ServiceJsonLd />
      <HowToJsonLd />

      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* ═══ Trust Chip Bar ═══ */}
        <div className="border-b bg-muted/40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" /> OMVIC Licensed
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" /> 4.8★ Google Rating
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Canada-Wide Service
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-primary" /> Same-Day Payment
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Hero Section with Form ═══ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/acquisition/we-buy-cars-hero.svg"
              alt="Planet Motors buys cars across Canada — any make, any model, instant cash offers"
              fill
              className="object-cover opacity-[0.07] dark:opacity-[0.04]"
              priority
              sizes="100vw"
            />
          </div>
          <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <SellYourCarHero
                headline="We Buy Cars Across Canada — Any Make, Any Model"
                subheadline="Get an instant cash offer for your vehicle. No haggling, no hidden fees, no hassle. Free pickup and same-day payment — guaranteed."
                highlightText="Instant Cash Offers"
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* ═══ What Makes Planet Motors Different — 6 Benefits ═══ */}
        <BenefitsSection
          title="What Makes Planet Motors Different"
          benefits={benefits}
        />

        {/* ═══ Types of Vehicles We Buy ═══ */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 md:text-4xl">
              Types of Vehicles We Buy
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              From everyday commuters to rare classics — we buy them all. Running or not, high mileage or low, get your instant cash offer today.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
              {vehicleTypes.map((vt) => (
                <div key={vt.label} className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 border hover:shadow-md transition-shadow">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <vt.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{vt.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ How It Works ═══ */}
        <ProcessSteps title="How It Works" steps={processSteps} />

        {/* Lifestyle Image Break */}
        <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <Image
            src="/images/acquisition/we-buy-cars-lifestyle.svg"
            alt="Customer and Planet Motors buyer completing a seamless car sale transaction"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-md">
              <p className="text-2xl md:text-3xl font-bold text-foreground">Any Make, Any Model, Any Condition</p>
              <p className="text-muted-foreground mt-2">From sedans to trucks — we buy them all across Canada</p>
            </div>
          </div>
        </section>

        {/* ═══ Comparison Table ═══ */}
        <ComparisonTable
          title="Planet Motors vs. Other Options"
          rows={comparisonRows}
          usLabel="Planet Motors"
          othersLabel="CarMax / Carvana / Clutch / Private Sale"
        />

        {/* ═══ Cities We Serve ═══ */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 md:text-4xl">
              Cities We Serve Across Canada
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              We buy cars in every major Canadian city and everywhere in between. Free pickup is included no matter where you are.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {cities.map((city) => (
                <div
                  key={city.name}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">
                    {city.name}, {city.province}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Don&apos;t see your city? No problem — we serve <strong>all of Canada</strong>.{' '}
              <a href={`tel:${PHONE_TOLL_FREE_TEL}`} className="text-primary hover:underline font-semibold">
                Call {PHONE_TOLL_FREE}
              </a>{' '}
              for a free quote.
            </p>
          </div>
        </section>

        {/* ═══ Testimonials ═══ */}
        <TestimonialsSection title="What Our Sellers Say" testimonials={testimonials} />

        {/* ═══ FAQs ═══ */}
        <FAQSection title="Frequently Asked Questions About Selling Your Car" faqs={faqs} />

        {/* ═══ Internal Links ═══ */}
        <section className="py-12 border-t bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-center mb-6">Explore More Services</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { href: '/sell-your-car', label: 'Sell Your Car' },
                { href: '/sell-your-tesla', label: 'Sell Your Tesla' },
                { href: '/trade-in', label: 'Trade-In Value' },
                { href: '/free-pickup', label: 'Free Pickup' },
                { href: '/inventory', label: 'Browse Inventory' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Final CTA ═══ */}
        <CTASection
          headline="Get Your Instant Cash Offer Today"
          subheadline="Join thousands of Canadians who sold their car the easy way — instant quote, free pickup, same-day payment."
          ctaText="Get Your Offer"
          ctaLink="/sell-your-car"
        />
      </main>

      <Footer />
    </div>
  )
}