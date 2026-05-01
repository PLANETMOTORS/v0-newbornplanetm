import { Metadata } from "next"
import Script from "next/script"
import dynamic from "next/dynamic"
import Link from "next/link"
import { CheckCircle, ArrowRight, Shield, Clock, BadgeCheck, User } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FinancialServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { RateDisclosure } from "@/components/rate-disclosure"
import { RATE_FLOOR, RATE_FLOOR_DISPLAY } from "@/lib/rates"
import { getPublicSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

const SITE_URL = getPublicSiteUrl()

export const metadata: Metadata = {
  title: "Car Loan Calculator 2026 | Monthly Payment & Affordability Estimator | Planet Motors",
  description: `Estimate your monthly car payments or find out how much car you can afford. Real-time HST calculation, trade-in value, bi-weekly & monthly options. Rates from ${RATE_FLOOR}% APR. All credit types welcome.`,
  keywords: "car loan calculator, car affordability calculator, monthly payment estimator, auto financing Canada, HST calculator, trade-in value, bi-weekly payments, 6.29% APR, Planet Motors financing",
  alternates: {
    canonical: '/financing',
  },
  openGraph: {
    title: "Car Loan Calculator 2026 | Payment & Affordability Estimator | Planet Motors",
    description: "Calculate your car loan payments or find your budget with HST, trade-in, and multi-lender rates. Pre-approval in 30 minutes.",
    url: `${SITE_URL}/financing`,
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
}

const FinanceApplicationForm = dynamic(
  () => import("@/components/finance-application-form").then((m) => m.FinanceApplicationForm),
)
const FinancingCalculator = dynamic(
  () => import("@/components/financing-calculator").then((m) => m.FinancingCalculator),
)

// Default lenders fallback - Generic lender partners
const defaultLenders = [
  { name: "Credit Union", rate: RATE_FLOOR_DISPLAY, term: "96 mo", logo: "CU", color: "bg-emerald-600" },
  { name: "Major Bank", rate: "6.49%", term: "84 mo", logo: "MB", color: "bg-blue-600" },
  { name: "Commercial Bank", rate: "6.79%", term: "72 mo", logo: "CB", color: "bg-slate-600" },
  { name: "Prime Lender", rate: "6.99%", term: "84 mo", logo: "PL", color: "bg-indigo-600" },
  { name: "Auto Finance", rate: "7.49%", term: "60 mo", logo: "AF", color: "bg-amber-600" },
]

const benefits = [
  "No impact on your credit score for pre-approval",
  "Compare rates from 20+ major Canadian lenders",
  "Get approved in as little as 30 minutes",
  "Flexible terms from 24 to 96 months",
  "No hidden fees or surprises",
  "Work with all credit situations",
]

const steps = [
  {
    number: "1",
    title: "Submit Application",
    description: "Fill out our simple online form with your basic information.",
  },
  {
    number: "2",
    title: "Credit Check",
    description: "Soft credit pull - no impact on your credit score.",
  },
  {
    number: "3",
    title: "Compare Offers",
    description: "Review rates from multiple lenders side by side.",
  },
  {
    number: "4",
    title: "Choose & Shop",
    description: "Select your best offer and start shopping with confidence.",
  },
]

const FAQ_ITEMS = [
  {
    question: "How is my car loan payment calculated?",
    answer: "Payments are calculated using the standard amortization formula: the loan principal (vehicle price + HST − trade-in − down payment) is multiplied by the periodic interest rate and compounded over the number of payment periods. Our calculator supports both monthly and bi-weekly frequencies.",
  },
  {
    question: "What is HST and how does it affect my car loan?",
    answer: "HST (Harmonized Sales Tax) is 13% in Ontario. It is applied to the vehicle price minus your trade-in value. When you trade in a vehicle, you only pay HST on the price difference — this is called the trade-in tax credit. Our calculator includes HST automatically in every estimate.",
  },
  {
    question: "What is a good car loan interest rate in Canada?",
    answer: `In 2026, competitive rates for buyers with strong credit typically range from ${RATE_FLOOR}% to 8% APR. Rates depend on your credit score, the vehicle age, and the loan term. We compare rates from 20+ Canadian lenders to find you the best option.`,
  },
  {
    question: "Should I choose bi-weekly or monthly payments?",
    answer: "Bi-weekly payments (every two weeks) result in 26 payments per year — equivalent to 13 monthly payments instead of 12. This accelerates your payoff and reduces total interest paid over the life of the loan.",
  },
  {
    question: "How does trade-in value reduce my loan?",
    answer: "Your trade-in value is subtracted from the vehicle price before HST is calculated. For example, a $10,000 trade-in on a $40,000 vehicle means you pay HST on $30,000 instead of $40,000 — saving you $1,300 in tax alone.",
  },
  {
    question: "Does using this calculator affect my credit score?",
    answer: "No. This calculator runs entirely in your browser — no credit check is performed. When you are ready to apply for pre-approval, we use a soft credit pull that does not impact your score.",
  },
]

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Planet Motors Car Loan Calculator",
      "description": `Calculate monthly or bi-weekly car loan payments, estimate your vehicle budget, and factor in HST, trade-in value, and down payment. Rates from ${RATE_FLOOR}% APR.`,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CAD" },
      "featureList": [
        "Real-time monthly and bi-weekly payment estimation",
        "Reverse affordability calculator",
        "HST (13%) tax inclusion",
        "Trade-in value with tax credit calculation",
        "Customizable interest rate from 0% to 30%",
        "Loan terms from 24 to 96 months",
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer },
      })),
    },
  ],
}

export default async function FinancingPage() {
  const lenders = defaultLenders
  const lowestRate = RATE_FLOOR

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FinancialServiceJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Financing", url: "/financing" }]} />
      <Script
        id="financing-calculator-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />
      <Header />

      <main id="main-content" tabIndex={-1}>
      {/* Hero */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                <BadgeCheck className="w-4 h-4" />
                <span className="tabular-nums">Rates from {lowestRate}% APR</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-balance">
                Get Pre-Approved for Auto Financing
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Compare rates from 20+ major Canadian lenders and get approved in minutes. No impact on your credit score.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.slice(0, 4).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">256-bit encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">30 min approval</span>
                </div>
              </div>
            </div>

            {/* Pre-approval Form */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
              <h2 className="font-bold text-xl mb-2">Start Your Pre-Approval</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Takes less than 5 minutes. No commitment required.
              </p>

              <FinanceApplicationForm />

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Already have a vehicle in mind?</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/financing/application">
                    <User className="w-4 h-4 mr-2" />
                    Complete Full Application
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lenders */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Multi-Lender Financing
            </h2>
            <p className="mt-4 text-muted-foreground">
              We work with Canada&apos;s top financial institutions to get you the best rates.
            </p>
          </div>

          {/* Lender Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {lenders.map((lender) => (
              <div key={lender.name} className="bg-background rounded-xl p-6 border border-border text-center hover:border-primary/30 hover:shadow-md transition-all">
                <div className={`w-14 h-14 ${lender.color} text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                  <span className="font-bold text-sm">{lender.logo}</span>
                </div>
                <h3 className="font-semibold text-sm">{lender.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2 tabular-nums">{lender.rate}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{lender.term}</p>
              </div>
            ))}
          </div>

          {/* Financing Flow Diagram */}
          <div className="mt-16 bg-background rounded-2xl border border-border p-8">
            <h3 className="font-semibold text-xl mb-8 text-center">Multi-Lender Financing Flow</h3>

            <div className="relative">
              {/* Flow diagram */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="font-semibold">CUSTOMER</p>
                  <p className="text-sm text-muted-foreground">Submits financing application</p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />

                <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                  <p className="font-semibold text-primary">FINANCING SERVICE</p>
                  <p className="text-sm text-muted-foreground">Equifax API</p>
                  <p className="text-xs text-muted-foreground mt-1">1. Soft credit pull (no score impact)</p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />

                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="font-semibold">CREDIT BUREAU</p>
                  <p className="text-sm text-muted-foreground">Equifax + TransUnion</p>
                  <p className="text-xs text-muted-foreground mt-1">2. Credit score + report</p>
                </div>
              </div>

              {/* Parallel lender requests */}
              <div className="mt-8 border-t border-border pt-8">
                <p className="text-center text-sm text-muted-foreground mb-6">PARALLEL LENDER REQUESTS</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="text-left py-2 px-4">Lender</th>
                        <th scope="col" className="text-center py-2 px-4">Credit Union</th>
                        <th scope="col" className="text-center py-2 px-4">Major Bank</th>
                        <th scope="col" className="text-center py-2 px-4">Commercial Bank</th>
                        <th scope="col" className="text-center py-2 px-4">Prime Lender</th>
                        <th scope="col" className="text-center py-2 px-4">Auto Finance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <th scope="row" className="text-left py-2 px-4 font-medium">RATES</th>
                        <td className="text-center py-2 px-4 text-primary font-semibold tabular-nums">{RATE_FLOOR_DISPLAY}</td>
                        <td className="text-center py-2 px-4 tabular-nums">6.49%</td>
                        <td className="text-center py-2 px-4 tabular-nums">6.79%</td>
                        <td className="text-center py-2 px-4 tabular-nums">6.99%</td>
                        <td className="text-center py-2 px-4 tabular-nums">7.49%</td>
                      </tr>
                      <tr>
                        <th scope="row" className="text-left py-2 px-4 font-medium">TERMS</th>
                        <td className="text-center py-2 px-4 tabular-nums">96 mo</td>
                        <td className="text-center py-2 px-4 tabular-nums">84 mo</td>
                        <td className="text-center py-2 px-4 tabular-nums">72 mo</td>
                        <td className="text-center py-2 px-4 tabular-nums">84 mo</td>
                        <td className="text-center py-2 px-4 tabular-nums">60 mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">3. Aggregate and rank offers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financing Calculator */}
      <section id="calculator" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Car Loan Calculator
            </h2>
            <p className="mt-4 text-muted-foreground">
              Estimate your monthly or bi-weekly payments, or find out how much vehicle you can afford. HST and trade-in tax credits included automatically.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
            <FinancingCalculator />
          </div>

          {/* No-JS fallback for search bots */}
          <noscript>
            <div className="mt-8 bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-lg mb-4">Sample Monthly Payments (72 months, {RATE_FLOOR}% APR, HST included)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="text-left py-2">Vehicle Price</th>
                    <th scope="col" className="text-right py-2">Monthly</th>
                    <th scope="col" className="text-right py-2">Bi-weekly</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2">$20,000</td><td className="text-right py-2">$378</td><td className="text-right py-2">$174</td></tr>
                  <tr className="border-b"><td className="py-2">$30,000</td><td className="text-right py-2">$566</td><td className="text-right py-2">$261</td></tr>
                  <tr className="border-b"><td className="py-2">$40,000</td><td className="text-right py-2">$755</td><td className="text-right py-2">$348</td></tr>
                  <tr className="border-b"><td className="py-2">$50,000</td><td className="text-right py-2">$944</td><td className="text-right py-2">$435</td></tr>
                  <tr><td className="py-2">$60,000</td><td className="text-right py-2">$1,133</td><td className="text-right py-2">$522</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-4">
                Estimates include 13% HST. Actual rates depend on credit approval (O.A.C.). Enable JavaScript for the full interactive calculator.
              </p>
            </div>
          </noscript>
        </div>
      </section>

      {/* FAQ — visible to users & matches FAQPage schema */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group bg-background rounded-xl border border-border p-6">
                <summary className="cursor-pointer font-semibold text-base list-none flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl leading-none shrink-0">+</span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-card rounded-xl p-6 border border-border">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
        {/* Rate Disclosure — OMVIC compliance */}
        <section className="py-8 bg-muted/50 border-t">
          <div className="container max-w-4xl mx-auto px-4">
            <RateDisclosure />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
