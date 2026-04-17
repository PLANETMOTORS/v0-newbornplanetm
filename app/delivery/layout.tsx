import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nationwide Vehicle Delivery | Planet Motors - Free Within 300km",
  description: "Get your vehicle delivered to your door anywhere in Canada. Free delivery within 300km of Richmond Hill. Enter your postal code for an instant delivery quote. Real-time tracking included.",
  keywords: [
    "car delivery Canada",
    "vehicle delivery Ontario",
    "free car delivery",
    "nationwide vehicle shipping",
    "car transport Canada",
    "delivery cost calculator",
    "Planet Motors delivery",
  ].join(", "),
  alternates: {
    canonical: "/delivery",
  },
  openGraph: {
    title: "Nationwide Vehicle Delivery | Planet Motors",
    description: "Free delivery within 300km. Enter your postal code for an instant quote. Real-time tracking on every delivery.",
    url: "/delivery",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nationwide Vehicle Delivery | Planet Motors",
    description: "Free delivery within 300km. Enter your postal code for an instant quote.",
  },
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return children
}
