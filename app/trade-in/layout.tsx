import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sell or Trade Your Vehicle in Canada | Instant Offer | Planet Motors",
  description: "Get a competitive offer in 60 seconds. Canadian Black Book valuation. Same-day payment available. No obligation, no hidden fees. VIN or plate lookup.",
  keywords: [
    "trade in car Canada",
    "vehicle trade-in value",
    "sell my car Canada",
    "instant trade-in offer",
    "car trade-in calculator",
    "trade-in value estimator",
    "Planet Motors trade-in",
  ].join(", "),
  alternates: {
    canonical: "/trade-in",
  },
  openGraph: {
    title: "Sell or Trade Your Vehicle in Canada | Instant Offer | Planet Motors",
    description: "Get a competitive offer in 60 seconds. Canadian Black Book valuation. Same-day payment available.",
    url: "/trade-in",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell or Trade Your Vehicle | Planet Motors",
    description: "Competitive offer in 60 seconds. Canadian Black Book valuation. Same-day payment.",
  },
}

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
  return children
}
