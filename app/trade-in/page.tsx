import { Suspense } from "react"
import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TradeInProvider } from "@/components/trade-in/trade-in-context"
import { TradeInHero } from "@/components/trade-in/trade-in-hero"
import { TradeInWizard } from "@/components/trade-in/trade-in-wizard"
import { TradeInOfferDisplay } from "@/components/trade-in/trade-in-offer-display"
import { TradeInHowItWorks } from "@/components/trade-in/trade-in-how-it-works"
import { TradeInComparison } from "@/components/trade-in/trade-in-comparison"
import { TradeInFinalCta } from "@/components/trade-in/trade-in-final-cta"
import { TradeInPageJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Trade In Your Car | Instant Cash Offer | Planet Motors",
  description: "Get an instant trade-in offer for your vehicle powered by Canadian Black Book. No haggling, free pickup anywhere in Canada, payment within 24 hours.",
  openGraph: {
    title: "Trade In Your Car | Instant Cash Offer | Planet Motors",
    description: "Get an instant trade-in offer powered by Canadian Black Book. Free pickup, 24-hour payment.",
    url: "https://www.planetmotors.ca/trade-in",
  },
}

function TradeInContent() {
  return (
    <TradeInProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <TradeInHero />
          <TradeInWizard />
          <TradeInOfferDisplay />
          <TradeInHowItWorks />
          <TradeInComparison />
          <TradeInFinalCta />
        </main>
        <Footer />
      </div>
    </TradeInProvider>
  )
}

export default function TradeInPage() {
  return (
    <>
      <TradeInPageJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Trade-In", url: "/trade-in" }]} />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading trade-in...</p>
          </div>
        </div>
      }>
        <TradeInContent />
      </Suspense>
    </>
  )
}
