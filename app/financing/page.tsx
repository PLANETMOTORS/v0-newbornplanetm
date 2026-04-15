import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Auto Financing & Pre-Approval | Planet Motors",
  description: "Get pre-approved for auto financing in minutes. No impact on your credit score. Competitive rates from multiple lenders. Apply online today.",
  alternates: {
    canonical: '/financing',
  },
}

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FinancialServiceJsonLd } from "@/components/seo/json-ld"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { Button } from "@/components/ui/button"

import { FinanceApplicationForm } from "@/components/finance-application-form"
import { CheckCircle, ArrowRight, Shield, Clock, BadgeCheck, User } from "lucide-react"
import Link from "next/link"

// Default lenders fallback - Generic lender partners
const defaultLenders = [
  { name: "Credit Union", rate: "6.29%", term: "96 mo", logo: "CU", color: "bg-emerald-600" },
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
  const lowestRate = 6.29

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FinancialServiceJsonLd />
      <Header />

      {/* Hero */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <BadgeCheck className="w-4 h-4" />
                <span>Rates from {lowestRate}% APR</span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
                Get Pre-Approved for Auto Financing
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Compare rates from 20+ major Canadian lenders and get approved in minutes. No impact on your credit score.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.slice(0, 4).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
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
              <h2 className="font-semibold text-xl mb-2">Start Your Pre-Approval</h2>
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
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
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
                  <span className="font-bold text-xs">{lender.logo}</span>
                </div>
                <h3 className="font-semibold text-sm">{lender.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">{lender.rate}</p>
                <p className="text-xs text-muted-foreground">{lender.term}</p>
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
                  <p className="font-medium">CUSTOMER</p>
                  <p className="text-sm text-muted-foreground">Submits financing application</p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />

                <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                  <p className="font-medium text-primary">FINANCING SERVICE</p>
                  <p className="text-sm text-muted-foreground">Equifax API</p>
                  <p className="text-xs text-muted-foreground mt-1">1. Soft credit pull (no score impact)</p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                <div className="w-0.5 h-8 bg-muted-foreground/30 md:hidden" />

                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="font-medium">CREDIT BUREAU</p>
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
                        <th className="text-left py-2 px-4">Lender</th>
                        <th className="text-center py-2 px-4">Credit Union</th>
                        <th className="text-center py-2 px-4">Major Bank</th>
                        <th className="text-center py-2 px-4">Commercial Bank</th>
                        <th className="text-center py-2 px-4">Prime Lender</th>
                        <th className="text-center py-2 px-4">Auto Finance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 px-4 font-medium">RATES</td>
                        <td className="text-center py-2 px-4 text-primary font-medium">6.29%</td>
                        <td className="text-center py-2 px-4">6.49%</td>
                        <td className="text-center py-2 px-4">6.79%</td>
                        <td className="text-center py-2 px-4">6.99%</td>
                        <td className="text-center py-2 px-4">7.49%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-medium">TERMS</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">72 mo</td>
                        <td className="text-center py-2 px-4">84 mo</td>
                        <td className="text-center py-2 px-4">96 mo</td>
                        <td className="text-center py-2 px-4 text-primary font-medium">96 mo</td>
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

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
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

      <Footer />
      <LiveChatWidget />
    </div>
  )
}
