import { Metadata } from 'next'
import Link from 'next/link'
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

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sell Your Tesla in Canada | Top Dollar, Same-Day Payment',
  description:
    'Sell your Tesla for top dollar in Canada. OMVIC-licensed dealer since 2005. EV expertise, Aviloo battery knowledge, same-day payment, and free Canada-wide pickup. Get your instant Tesla valuation today.',
  path: '/sell-your-tesla',
  keywords: [
    'sell my Tesla Canada',
    'sell Tesla online',
    'Tesla trade-in value',
    'sell used Tesla',
    'Tesla appraisal Canada',
    'sell Tesla Model 3',
    'sell Tesla Model Y',
    'Tesla buyer Canada',
  ],
})

const benefits = [
  { icon: 'Zap', title: 'EV & Tesla Expertise', description: 'Our team specializes in electric vehicles. We understand Tesla technology, battery health, and the true value of your car.' },
  { icon: 'Shield', title: 'Aviloo Battery Knowledge', description: 'We use independent Aviloo FLASH Test data to assess battery State of Health — so your Tesla is valued fairly, not guessed at.' },
  { icon: 'DollarSign', title: 'Fair Market Value', description: 'We pay top dollar based on real Canadian market data. No lowball offers, no hidden deductions.' },
  { icon: 'Clock', title: 'Same-Day Payment', description: 'Accept our offer and get paid the same day by direct deposit or certified cheque. No waiting.' },
  { icon: 'Car', title: 'Free Canada-Wide Pickup', description: 'We arrange free vehicle pickup anywhere in Canada. No need to drive to a dealership.' },
  { icon: 'ThumbsUp', title: 'OMVIC Licensed Since 2005', description: 'We are a fully licensed Ontario dealer. Transparent, regulated, and trustworthy — your sale is protected.' },
]

const processSteps = [
  { stepNumber: 1, title: 'Get Your Instant Tesla Quote', description: 'Fill out our simple form with your Tesla details — model, year, mileage, and condition. Receive a competitive offer in minutes.' },
  { stepNumber: 2, title: 'Schedule a Quick Inspection', description: 'We come to you anywhere in Canada for a free 15-minute inspection. No trips to a dealership required.' },
  { stepNumber: 3, title: 'Get Paid Same Day', description: 'Accept the offer and get paid immediately by direct deposit or certified cheque. We handle all paperwork and pickup.' },
]

const comparisonRows = [
  { feature: 'EV & Tesla Expertise', us: 'Dedicated EV team', others: 'Generic appraisals' },
  { feature: 'Battery Health Assessment', us: 'Aviloo-informed valuation', others: 'Not assessed' },
  { feature: 'Payment Speed', us: 'Same day', others: '5–14 business days' },
  { feature: 'Pickup Service', us: 'Free, Canada-wide', others: 'Seller drops off' },
  { feature: 'Hidden Fees', us: 'None — price is the price', others: 'Admin / reconditioning fees' },
  { feature: 'OMVIC Licensed', us: 'Yes — since 2005', others: 'Varies / unlicensed' },
  { feature: 'Instant Offer', us: 'Yes, online in minutes', others: 'Days to weeks' },
]

const testimonials = [
  { name: 'Sarah M.', location: 'Toronto, ON', quote: 'Sold my 2022 Model 3 Long Range to Planet Motors. They offered $4,000 more than Tesla trade-in and picked it up from my condo. Payment hit my account the same afternoon.', rating: 5, vehiclePurchased: '2022 Tesla Model 3 LR' },
  { name: 'David K.', location: 'Vancouver, BC', quote: 'I was nervous selling privately but Planet Motors made it effortless. They understood the Aviloo battery report and valued my Model Y fairly. The whole process took less than a day.', rating: 5, vehiclePurchased: '2021 Tesla Model Y' },
  { name: 'Michelle T.', location: 'Calgary, AB', quote: 'Best experience selling a car, period. They flew a driver out to Calgary, inspected my Model S on the spot, and I had payment within hours. Highly recommend for any Tesla owner.', rating: 5, vehiclePurchased: '2020 Tesla Model S' },
]


const faqs = [
  { question: 'How much is my Tesla worth?', answer: 'Your Tesla's value depends on the model, year, mileage, battery health, and condition. Fill out our form for a free, no-obligation instant quote based on current Canadian market data.' },
  { question: 'Do you buy all Tesla models?', answer: 'Yes. We buy the Model 3, Model Y, Model S, Model X, and Cybertruck — any year, any trim, any condition.' },
  { question: 'How does the battery health affect my Tesla's value?', answer: 'Battery State of Health (SoH) is a key factor. We use Aviloo FLASH Test data when available to assess true battery condition, which means Tesla owners with well-maintained batteries get a fairer, higher offer.' },
  { question: 'How fast do I get paid?', answer: 'Same day. Once you accept our offer and we complete the inspection, payment is issued immediately by direct deposit or certified cheque.' },
  { question: 'Do I need to drive my Tesla to you?', answer: 'No. We offer free pickup anywhere in Canada. Our team comes to your location for the inspection and pickup — no trips to a dealership needed.' },
  { question: 'Is Planet Motors OMVIC licensed?', answer: 'Yes. Planet Motors has been OMVIC licensed since 2005. Your transaction is fully regulated and protected under Ontario dealer legislation.' },
  { question: 'What documents do I need to sell my Tesla?', answer: 'You will need the vehicle ownership (title), a valid photo ID, and the current registration. If there is a lien, we can coordinate the payout directly with your lender.' },
  { question: 'Can I sell my Tesla if I still owe money on it?', answer: 'Absolutely. We handle lien payouts directly. If your offer exceeds the balance, you receive the difference. If not, we will work with you on the shortfall.' },
  { question: 'How does your offer compare to Tesla trade-in?', answer: 'Our offers are consistently higher than Tesla trade-in values because we specialize in reselling pre-owned EVs and can pay closer to retail market value.' },
  { question: 'Do you buy Teslas with accident history?', answer: 'Yes. We purchase Teslas with prior accidents, though the offer reflects the vehicle history. We review the Carfax and inspect the vehicle thoroughly.' },
  { question: 'What if my Tesla has high mileage?', answer: 'We buy high-mileage Teslas. Mileage affects the offer, but Tesla drivetrains are built for longevity — and we factor that into our valuation.' },
  { question: 'How long does the entire process take?', answer: 'Most sales are completed within 24 hours — from submitting your details online to receiving payment.' },
  { question: 'Do you buy Teslas outside of Ontario?', answer: 'Yes. We buy Teslas from every province and territory in Canada with free pickup included.' },
  { question: 'Is there any obligation after I get a quote?', answer: 'None at all. Our quotes are free and no-obligation. If our offer doesn't work for you, there is zero pressure.' },
  { question: 'Can I sell my Tesla and buy another car from you?', answer: 'Yes. Many Tesla sellers upgrade or switch to a different vehicle from our inventory. We can apply your Tesla's value as a trade-in credit toward any vehicle we stock.' },
]

const teslaModels = [
  { name: 'Model 3', description: 'Standard Range Plus, Long Range, Performance — all years and trims.' },
  { name: 'Model Y', description: 'Long Range and Performance — Canada's best-selling EV.' },
  { name: 'Model S', description: 'Long Range, Plaid, and legacy trims — including older Model S 85/90/100D.' },
  { name: 'Model X', description: 'Long Range and Plaid — including early production models with Falcon Wing doors.' },
  { name: 'Cybertruck', description: 'All configurations — Foundation Series, AWD, and Cyberbeast.' },
]

export default function SellYourTeslaPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Sell Your Car', url: '/sell-your-car' },
        { name: 'Sell Your Tesla', url: '/sell-your-tesla' },
      ]} />
      <FAQJsonLd faqs={faqs} />
      <ServiceJsonLd
        name="Tesla Vehicle Acquisition Service"
        description="Sell your Tesla for top dollar in Canada. OMVIC-licensed dealer with EV expertise, Aviloo battery knowledge, same-day payment, and free Canada-wide pickup."
        serviceType="Vehicle Acquisition"
        url="/sell-your-tesla"
      />
      <HowToJsonLd
        name="How to Sell Your Tesla to Planet Motors"
        description="Sell your Tesla in 3 simple steps — get an instant quote, schedule a free inspection, and get paid the same day."
        steps={processSteps.map(s => ({ title: s.title, description: s.description }))}
      />

      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Trust Chip Bar */}
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
              <span>OMVIC Licensed</span>
              <span className="hidden sm:inline text-border">|</span>
              <span>Since 2005</span>
              <span className="hidden sm:inline text-border">|</span>
              <span>Same-Day Payment</span>
              <span className="hidden sm:inline text-border">|</span>
              <span>Free Canada-Wide Pickup</span>
            </div>
          </div>
        </div>

        {/* Hero Section with Form */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <SellYourCarHero
                headline="Sell Your Tesla for Top Dollar in Canada"
                subheadline="Canada's EV-focused dealer pays more for your Tesla. Aviloo battery expertise, same-day payment, and free pickup from coast to coast."
                highlightText="Tesla Sellers Get +$500 EV Bonus"
              />
              <SellYourCarForm />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <BenefitsSection
          title="Why Sell Your Tesla to Planet Motors?"
          benefits={benefits}
        />

        {/* How It Works */}
        <ProcessSteps
          title="How It Works — 3 Simple Steps"
          steps={processSteps}
        />

        {/* Tesla Models We Buy */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 md:text-4xl">Tesla Models We Buy</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              We purchase every Tesla model sold in Canada — any year, any condition, any province.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {teslaModels.map((model) => (
                <div key={model.name} className="rounded-xl border bg-background p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-2">Tesla {model.name}</h3>
                  <p className="text-muted-foreground text-sm">{model.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <ComparisonTable
          title="Planet Motors vs. Other Options for Tesla Sellers"
          rows={comparisonRows}
          usLabel="Planet Motors"
          othersLabel="Carvana / Clutch / Private Sale"
        />

        {/* Testimonials */}
        <TestimonialsSection
          title="What Tesla Sellers Say About Us"
          testimonials={testimonials}
        />

        {/* FAQ */}
        <FAQSection
          title="Frequently Asked Questions About Selling Your Tesla"
          faqs={faqs}
        />

        {/* Internal Links Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Explore More Options</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/sell-your-car" className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                Sell Any Car
              </Link>
              <Link href="/trade-in" className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                Trade-In Your Vehicle
              </Link>
              <Link href="/free-pickup" className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                Free Pickup Service
              </Link>
              <Link href="/we-buy-cars" className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                We Buy Cars
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          headline="Ready to Sell Your Tesla?"
          subheadline="Get your free, no-obligation instant Tesla valuation in minutes"
          ctaText="Get Your Instant Tesla Valuation"
          ctaLink="/sell-your-car#quote-form"
        />
      </main>
      <Footer />
    </div>
  )
}