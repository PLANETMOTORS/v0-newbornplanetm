import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EV Battery Health & Diagnostics | Planet Motors - Aviloo SOH Reports",
  description: "Every EV at Planet Motors includes a certified Aviloo battery State of Health report. Understand battery degradation, range retention, and charging capacity before you buy.",
  keywords: [
    "EV battery health",
    "electric vehicle battery test",
    "Aviloo battery report",
    "EV battery degradation",
    "State of Health EV",
    "electric car battery life Canada",
    "used EV battery check",
    "EV range test",
  ].join(", "),
  alternates: {
    canonical: "/ev-battery-health",
  },
  openGraph: {
    title: "EV Battery Health & Diagnostics | Planet Motors",
    description: "Certified Aviloo battery State of Health reports on every EV. Know your battery's true condition before you buy.",
    url: "/ev-battery-health",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EV Battery Health & Diagnostics | Planet Motors",
    description: "Certified Aviloo battery State of Health reports on every EV. Know your battery's true condition before you buy.",
  },
}

export default function EVBatteryHealthLayout({ children }: { children: React.ReactNode }) {
  return children
}
