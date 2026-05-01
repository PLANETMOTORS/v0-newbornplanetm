import { Metadata } from "next"
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
  title: "Used Car Financing in Canada | Rates from 6.29% APR | Planet Motors",
  description: "Compare rates from 20+ Canadian lenders. Soft credit check, pre-approval in 30 minutes. All credit types welcome. O.A.C. No impact on your credit score.",
  keywords: "auto financing Canada, used car loan, pre-approval, bad credit financing, 6.29% APR, Canadian lenders, Planet Motors financing",
  alternates: {
    canonical: '/financing',
  },
  openGraph: {
    title: "Used Car Financing in Canada | Rates from 6.29% APR | Planet Motors",
    description: "Compare rates from 20+ Canadian lenders. Pre-approval in 30 minutes. All credit types welcome.",
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

export default async function FinancingPage() {
  // Using default lenders (Sanity imports removed to fix module resolution)
  const lenders = defaultLenders

  // Get the lowest rate for display
  const lowestRate = RATE_FLOOR

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FinancialServiceJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Financing", url: "/financing" }]} />
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
              Financing Calculator
            </h2>
            <p className="mt-4 text-muted-foreground">
              Estimate your monthly payments before you apply. This calculator is for planning only — get pre-approved above for your actual rate.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-card rounded-2xl border border-border p-8 shadow-lg">
            <FinancingCalculator />
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
