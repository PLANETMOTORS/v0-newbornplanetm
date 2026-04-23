import Script from "next/script"
import Link from "next/link"
import {
  Shield, Clock, DollarSign, TrendingUp, Truck, CheckCircle,
  ArrowRight, Car, BadgeCheck, Banknote
} from "lucide-react"
import { generateSEOMetadata } from "@/lib/seo/metadata"
import { getPublicSiteUrl } from "@/lib/site-url"
import { FAQJsonLd, BreadcrumbJsonLd, TradeInPageJsonLd } from "@/components/seo/json-ld"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"
import TradeInWizard from "./trade-in-wizard"
import { TradeInFaqAccordion } from "./trade-in-faq-accordion"

/* ── Metadata ── */
export const metadata = generateSEOMetadata({
  title: "Trade In Your Car in Canada | Instant Valuation",
  description:
    "Get an instant trade-in value for your vehicle at Planet Motors. Apply your trade equity toward any vehicle in our inventory. Canadian Black Book valuation. OMVIC licensed.",
  path: "/trade-in",
  keywords: [
    "trade in car Canada",
    "trade in value calculator",
    "car trade in",
    "vehicle trade in Ontario",
    "trade in vs sell",
    "instant trade-in offer",
    "Canadian Black Book valuation",
  ],
})

/* ── FAQ Data ── */
const tradeInFaqs = [
  {
    question: "How does the trade-in process work at Planet Motors?",
    answer:
      "Start by entering your vehicle details into our online tool. You'll receive an instant estimated value powered by Canadian Black Book data. If you like the offer, schedule a quick inspection and we'll finalize the price. Your trade equity is applied directly to your next vehicle purchase — or we can buy your car outright.",
  },
  {
    question: "How is my trade-in value calculated?",
    answer:
      "We use Canadian Black Book wholesale and retail data, combined with current market conditions, your vehicle's mileage, condition, and local supply and demand. Our appraisers verify the value during a brief in-person inspection.",
  },
  {
    question: "Do I have to buy a vehicle to trade in my car?",
    answer:
      "No. While many customers apply trade equity toward a new purchase, we also buy vehicles outright. Visit our Sell Your Car page for a standalone cash offer.",
  },
  {
    question: "Can I trade in a vehicle with an outstanding loan?",
    answer:
      "Yes. We handle lien payoffs regularly. If your trade value exceeds the loan balance, the positive equity is applied to your purchase. If the balance is higher, the negative equity can often be rolled into your new financing.",
  },
  {
    question: "What documents do I need for a trade-in?",
    answer:
      "Bring your vehicle ownership (registration), a valid photo ID, all keys and remotes, and your loan/lease payoff statement if applicable. A recent service history is helpful but not required.",
  },
  {
    question: "How long is a trade-in offer valid?",
    answer:
      "Our online estimates are valid for 7 days. Once an appraiser inspects the vehicle and provides a firm offer, that price is guaranteed for 72 hours.",
  },
  {
    question: "Will modifications or aftermarket parts affect my trade-in value?",
    answer:
      "It depends. OEM-quality upgrades (e.g., winter tire package, factory accessories) can increase value. Non-OEM modifications may reduce it because the dealership must return the vehicle to stock condition for resale.",
  },
  {
    question: "Can I trade in a leased vehicle?",
    answer:
      "Yes, in most cases. We'll contact your leasing company for a buyout quote. If the vehicle's market value exceeds the buyout, you keep the positive equity. Some lease contracts have restrictions, so we'll review the details with you.",
  },
  {
    question: "Is the trade-in valuation free?",
    answer:
      "Absolutely. The online estimate and the in-person appraisal are both free with no obligation. You're never pressured to accept an offer.",
  },
  {
    question: "Do you accept vehicles that need repairs?",
    answer:
      "Yes. We accept vehicles in almost any condition — running or not. Mechanical issues, cosmetic damage, and high mileage are all considered in the appraisal. The offer simply reflects the current state of the vehicle.",
  },
  {
    question: "How does trade-in compare to selling privately?",
    answer:
      "Trading in is faster and hassle-free — no listings, no strangers visiting your home, and no negotiation. You also save on HST in Ontario because the tax is calculated on the net difference between the new vehicle price and your trade-in value, which can save you thousands.",
  },
  {
    question: "Can I get a trade-in estimate without visiting the dealership?",
    answer:
      "Yes. Use our online trade-in tool right here to get an instant estimate. You only need to visit when you're ready to finalize the appraisal and complete the transaction.",
  },
]

/* ── How-To Steps ── */
const howItWorksSteps = [
  {
    icon: Car,
    title: "Enter Your Vehicle",
    description: "Provide year, make, model, mileage, and condition using our quick online form.",
  },
  {
    icon: DollarSign,
    title: "Get Instant Estimate",
    description: "Receive a competitive offer based on Canadian Black Book data in under 60 seconds.",
  },
  {
    icon: BadgeCheck,
    title: "Quick Inspection",
    description: "Schedule a brief in-person appraisal to finalize the value — no obligation.",
  },
  {
    icon: Banknote,
    title: "Apply or Cash Out",
    description: "Use your trade equity toward any vehicle in our inventory, or receive a direct payment.",
  },
]

/* ── Benefits ── */
const tradeInBenefits = [
  { icon: Clock, text: "Instant online estimate — results in under 60 seconds" },
  { icon: DollarSign, text: "HST savings — tax calculated on the price difference" },
  { icon: Shield, text: "OMVIC-licensed dealer — transparent, regulated process" },
  { icon: TrendingUp, text: "Canadian Black Book data — fair market-based pricing" },
  { icon: Truck, text: "Free pickup available within the GTA" },
  { icon: CheckCircle, text: "No obligation — get a value with zero pressure" },
]


/* ── JSON-LD: HowTo Schema ── */
function TradeInHowToJsonLd() {
  const siteUrl = getPublicSiteUrl()
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Trade In Your Car at Planet Motors",
    description:
      "Follow these four steps to trade in your vehicle at Planet Motors and apply your equity toward a new purchase.",
    step: howItWorksSteps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.description,
      url: `${siteUrl}/trade-in`,
    })),
    totalTime: "PT5M",
  }
  return (
    <Script
      id="trade-in-howto-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/* ── Page Component ── */
export default function TradeInPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Schemas */}
      <TradeInPageJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Trade-In", url: "/trade-in" }]} />
      <FAQJsonLd faqs={tradeInFaqs} />
      <TradeInHowToJsonLd />

      {/* ── SEO Hero Section ── */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          {/* Trust Chip Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> OMVIC Licensed</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Canadian Black Book</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> 60-Second Estimates</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" /> No Obligation</span>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Trade In Your Car at Planet Motors
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Get a fair, market-based value for your vehicle in under 60&nbsp;seconds. Apply your trade-in equity
              toward any car in our inventory — or take the cash. Free appraisal, no obligation, OMVIC regulated.
            </p>
          </div>
        </div>
      </section>

      {/* ── How Trade-In Works ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10 md:text-3xl">How Trade-In Works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                {i < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                )}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-primary mb-1">Step {i + 1}</p>
                <h3 className="text-base font-bold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trade-In Benefits ── */}
      <section className="py-12 md:py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 md:text-3xl">Why Trade In With Planet Motors</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {tradeInBenefits.map((b) => (
              <div key={b.text} className="flex items-start gap-3 p-4 rounded-xl bg-background border">
                <b.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trade-In Wizard (Client Component) ── */}
      <TradeInWizard />

      {/* ── FAQ Section ── */}
      <section className="py-12 md:py-16 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Trade-In FAQ</h2>
            <p className="mt-2 text-muted-foreground">
              Common questions about trading in your vehicle at Planet Motors.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <TradeInFaqAccordion faqs={tradeInFaqs} />
          </div>
        </div>
      </section>

      {/* ── Internal Links ── */}
      <section className="py-10 border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-center mb-6">Explore More Options</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: "/sell-your-car", label: "Sell Your Car" },
              { href: "/sell-your-tesla", label: "Sell Your Tesla" },
              { href: "/we-buy-cars", label: "We Buy Cars" },
              { href: "/free-pickup", label: "Free Pickup" },
              { href: "/inventory", label: "Browse Inventory" },
              { href: "/financing", label: "Financing" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}