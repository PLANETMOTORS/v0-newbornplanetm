import Image from 'next/image'
import Link from 'next/link'
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
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd, HowToJsonLd } from '@/components/seo/json-ld'
import { TrustBadgesCompact } from '@/components/trust-badges'
import { Shield, MapPin, CreditCard, FileText, Phone } from 'lucide-react'

export const metadata = generateSEOMetadata({
  title: 'Free Car Pickup Across Canada',
  description: 'Sell your car with free pickup anywhere in Canada. We come to you — no driving to a dealership. Same-day payment, OMVIC licensed.',
  path: '/free-pickup',
  keywords: [
    'free car pickup Canada',
    'car pickup service',
    'sell car from home',
    'mobile car buyer',
    'free vehicle transport',
  ],
})

const pickupSteps = [
  { stepNumber: 1, title: 'Get Your Quote', description: 'Submit your vehicle details online or call us for an instant, no-obligation cash offer — takes under 2 minutes.' },
  { stepNumber: 2, title: 'Accept Your Offer', description: 'Review your competitive offer. No haggling, no pressure. The price we quote is the price you get.' },
  { stepNumber: 3, title: 'Schedule Pickup', description: 'Choose a date and time that works for you. We arrange everything — including insured, enclosed transport to our facility.' },
  { stepNumber: 4, title: 'Get Paid', description: 'Our team arrives at your door, completes a quick inspection, and you receive same-day payment via e-Transfer or cheque.' },
]

const pickupBenefits = [
  { icon: 'Truck', title: 'No Driving Required', description: 'Stay home while we pick up your vehicle — no trips to the dealership needed.' },
  { icon: 'DollarSign', title: '100% Free Service', description: 'Our pickup service is completely free. No transport fees, no hidden charges.' },
  { icon: 'Shield', title: 'Fully Insured Transport', description: 'Your vehicle is covered by comprehensive insurance from pickup to our facility.' },
  { icon: 'Clock', title: 'Flexible Scheduling', description: 'Choose any day and time that works for you, including evenings and weekends.' },
  { icon: 'Zap', title: 'Same-Day Payment', description: 'Get paid the same day we pick up your vehicle — no waiting for bank transfers.' },
  { icon: 'ThumbsUp', title: 'No Obligation', description: 'Changed your mind? Cancel anytime before the pickup at no cost.' },
]

const comparisonRows = [
  { feature: 'Pickup Cost', us: 'Free', others: '$200–$500+' },
  { feature: 'Who Drives', us: 'We come to you', others: 'You drive' },
  { feature: 'Scheduling', us: 'Your convenience', others: 'Their hours only' },
  { feature: 'Insurance During Transport', us: 'Fully covered', others: 'Your responsibility' },
  { feature: 'Payment Speed', us: 'Same day', others: '1–2 weeks' },
  { feature: 'Hidden Fees', us: 'None', others: 'Towing fees, admin fees' },
  { feature: 'OMVIC Licensed', us: 'Yes', others: 'Often not' },
]

const testimonials = [
  { name: 'Sarah M.', location: 'Vancouver, BC', quote: 'I live 4 hours from the nearest dealership. Planet Motors picked up my Tesla right from my driveway and paid me that same afternoon. Easiest car sale ever.', rating: 5, vehiclePurchased: '2021 Tesla Model 3' },
  { name: 'David K.', location: 'Thunder Bay, ON', quote: 'Living in Northern Ontario, I thought selling my car would be a nightmare. Planet Motors arranged free pickup and I got a better price than any local offer.', rating: 5, vehiclePurchased: '2020 Hyundai Kona EV' },
  { name: 'Marie-Claire L.', location: 'Moncton, NB', quote: 'The whole process took less than a week from quote to payment. The pickup driver was professional and on time. Highly recommend for anyone outside a major city.', rating: 5, vehiclePurchased: '2019 Nissan Leaf' },
]

const faqs = [
  { question: 'Is the pickup service really free?', answer: 'Yes, 100% free. We cover all transport costs including fuel, insurance, and driver fees. There are no hidden charges or deductions from your offer price.' },
  { question: 'How far will you travel to pick up my car?', answer: 'We pick up vehicles from anywhere in Canada — coast to coast. Whether you are in downtown Toronto or a rural town in Northern BC, we will come to you.' },
  { question: 'How long does the pickup take?', answer: 'The actual pickup appointment takes about 15–30 minutes. Our team inspects the vehicle, completes paperwork, and arranges payment on the spot.' },
  { question: 'Do I need to be home during the pickup?', answer: 'Yes, someone with authority to sign the sale documents and hand over the keys must be present during the pickup appointment.' },
  { question: 'What payment methods do you offer?', answer: 'We offer same-day payment via Interac e-Transfer (instant) or certified cheque. You choose whichever method you prefer.' },
  { question: 'What documents do I need ready for pickup day?', answer: 'You will need the vehicle ownership (title), a valid government-issued photo ID, all sets of keys and fobs, and the vehicle registration.' },
  { question: 'Can I cancel after scheduling a pickup?', answer: 'Absolutely. You can cancel or reschedule your pickup at any time before the driver arrives, with no penalties or fees.' },
  { question: 'What if my car does not start or is not driveable?', answer: 'No problem. We purchase vehicles in any condition, including non-running cars. Our flatbed transport can load non-driveable vehicles.' },
  { question: 'Is my vehicle insured during transport?', answer: 'Yes. Every vehicle we transport is covered by our comprehensive commercial transport insurance from the moment we load it until it arrives at our facility.' },
  { question: 'How is the pickup price determined?', answer: 'Your offer is based on your vehicle\'s year, make, model, mileage, condition, and current Canadian market data. The pickup is a separate free service — it does not affect your offer price.' },
  { question: 'Do you pick up leased vehicles?', answer: 'We can purchase leased vehicles in most cases. Contact us with your lease details and we will walk you through the process, including any lease buyout steps.' },
  { question: 'What provinces and territories do you cover?', answer: 'All of them. We serve British Columbia, Alberta, Saskatchewan, Manitoba, Ontario, Quebec, New Brunswick, Nova Scotia, Prince Edward Island, Newfoundland and Labrador, Yukon, Northwest Territories, and Nunavut.' },
  { question: 'How do I schedule my free pickup?', answer: 'After accepting your offer, our team contacts you to arrange a pickup date and time that fits your schedule. You can also call us directly at 1-800-PLANET-M.' },
  { question: 'Will the offer change after the in-person inspection?', answer: 'If the vehicle condition matches what you described, the offer stays the same. If there are undisclosed issues, we will discuss any adjustments transparently before proceeding.' },
  { question: 'How is Planet Motors different from other car buyers?', answer: 'We are OMVIC licensed, offer genuinely free nationwide pickup, pay same-day, and never charge hidden fees. Our transparent process and thousands of happy sellers set us apart.' },
]

const provinces = [
  'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba',
  'Ontario', 'Quebec', 'New Brunswick', 'Nova Scotia',
  'Prince Edward Island', 'Newfoundland & Labrador',
  'Yukon', 'Northwest Territories', 'Nunavut',
]


export default function FreePickupPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Free Car Pickup', url: '/free-pickup' }]} />
      <ServiceJsonLd
        name="Free Car Pickup Service"
        description="Free vehicle pickup anywhere in Canada. We come to you — no driving to a dealership. Same-day payment, OMVIC licensed."
        serviceType="Vehicle Pickup Service"
        url="/free-pickup"
      />
      <FAQJsonLd faqs={faqs} />
      <HowToJsonLd
        name="How to Schedule a Free Car Pickup"
        description="Get a free quote, accept our offer, schedule your pickup, and get paid — all from the comfort of your home."
        steps={pickupSteps.map(s => ({ title: s.title, description: s.description }))}
      />

      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Trust Chip Bar */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4">
            <TrustBadgesCompact />
          </div>
        </div>

        {/* Hero Section with Form */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/acquisition/free-pickup-hero.svg"
              alt="Free car pickup service across Canada — flatbed loading a vehicle at customer's home"
              fill
              className="object-cover opacity-[0.07] dark:opacity-[0.04]"
              priority
              sizes="100vw"
            />
          </div>
          <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <SellYourCarHero
                headline="Free Car Pickup — Anywhere in Canada"
                subheadline="Sell your car without leaving home. We arrange free, insured pickup from your door and pay you the same day. No trips to the dealership, no transport fees, no hassle."
                highlightText="Free Nationwide Pickup"
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* How Our Pickup Service Works */}
        <ProcessSteps
          title="How Our Free Pickup Service Works"
          steps={pickupSteps}
        />

        {/* Lifestyle Image Break */}
        <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <Image
            src="/images/acquisition/free-pickup-lifestyle.svg"
            alt="Planet Motors transport truck on a Canadian highway providing free door-to-door car pickup"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-md">
              <p className="text-2xl md:text-3xl font-bold text-foreground">Coast to Coast, at No Cost</p>
              <p className="text-muted-foreground mt-2">Fully insured transport · Every province &amp; territory</p>
            </div>
          </div>
        </section>

        {/* Coverage Map Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 md:text-4xl">We Pick Up Cars Across All of Canada</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              From Victoria to St. John&apos;s, our free pickup service covers every province and territory.
              No matter how remote your location, we will come to you.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {provinces.map((province) => (
                <div key={province} className="flex items-center gap-2 p-3 rounded-lg bg-background border shadow-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">{province}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits of Free Pickup */}
        <BenefitsSection
          title="Benefits of Free Pickup"
          benefits={pickupBenefits}
        />

        {/* What to Expect on Pickup Day */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 md:text-4xl">What to Expect on Pickup Day</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Our pickup process is designed to be quick, transparent, and stress-free. Here is exactly what happens when our team arrives.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {[
                { icon: Phone, title: 'Confirmation Call', desc: 'Our driver calls 30 minutes before arrival to confirm the appointment and answer any last-minute questions.' },
                { icon: FileText, title: 'Quick Inspection', desc: 'A brief 10–15 minute walk-around to verify the vehicle condition matches your description. No surprises.' },
                { icon: Shield, title: 'Paperwork Signing', desc: 'We handle all the ownership transfer documents. Just sign where indicated and hand over the keys.' },
                { icon: CreditCard, title: 'Instant Payment', desc: 'Receive your payment via e-Transfer or certified cheque on the spot. The money is yours immediately.' },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 border">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <ComparisonTable
          title="Planet Motors Free Pickup vs. Other Options"
          rows={comparisonRows}
          usLabel="Planet Motors Free Pickup"
          othersLabel="Self-Deliver / Towing Service"
        />

        {/* FAQ Section */}
        <FAQSection
          title="Free Pickup — Frequently Asked Questions"
          faqs={faqs}
        />

        {/* Testimonials */}
        <TestimonialsSection
          title="What Remote Sellers Say About Our Pickup Service"
          testimonials={testimonials}
        />

        {/* Internal Links Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Explore More Ways We Can Help</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              {[
                { href: '/sell-your-car', label: 'Sell Your Car', desc: 'Get an instant cash offer' },
                { href: '/sell-your-tesla', label: 'Sell Your Tesla', desc: 'Top dollar for Tesla vehicles' },
                { href: '/we-buy-cars', label: 'We Buy Cars', desc: 'Any make, model, or condition' },
                { href: '/trade-in', label: 'Trade-In', desc: 'Upgrade to your next vehicle' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col p-5 rounded-xl border bg-background shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <span className="font-bold text-foreground">{link.label}</span>
                  <span className="text-sm text-muted-foreground mt-1">{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          headline="Schedule Your Free Pickup Today"
          subheadline="Sell your car from home. Free pickup, same-day payment, no hidden fees."
          ctaText="Get Your Free Quote"
          ctaLink="#quote-form"
        />
      </main>
      <Footer />
    </div>
  )
}