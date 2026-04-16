import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trade-In Your Vehicle | Planet Motors - Instant Offer",
  description: "Get an instant trade-in offer for your vehicle. No obligation, no hidden fees. Apply your trade-in value toward your next purchase at Planet Motors.",
  alternates: {
    canonical: '/trade-in',
  },
}

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
  return children
}
