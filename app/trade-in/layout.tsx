import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trade-In Your Vehicle | Planet Motors - Instant Online Offer",
  description: "Get an instant trade-in offer for your vehicle. No obligation, no hidden fees. Apply your trade-in value toward your next purchase at Planet Motors. VIN or plate lookup available.",
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
    title: "Trade-In Your Vehicle | Planet Motors - Instant Offer",
    description: "Get an instant trade-in offer. No obligation, no hidden fees. Apply your value toward your next purchase.",
    url: "/trade-in",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade-In Your Vehicle | Planet Motors",
    description: "Get an instant trade-in offer. No obligation, no hidden fees.",
  },
}

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
  return children
}
