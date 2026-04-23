import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Used EVs & Certified Pre-Owned Vehicles in Canada | Planet Motors",
  description: "Browse Aviloo-certified used EVs, hybrids, and SUVs. 210-point inspected, free Carfax. Canada-wide delivery. Financing from 6.29% APR. Filter by make, model, price, and fuel type.",
  keywords: [
    "used EVs Canada",
    "certified pre-owned vehicles",
    "Aviloo certified used cars",
    "electric vehicles for sale",
    "used Tesla Canada",
    "used BMW Canada",
    "car inventory Richmond Hill",
    "Planet Motors inventory",
  ].join(", "),
  alternates: {
    canonical: "/inventory",
  },
  openGraph: {
    title: "Used EVs & Certified Pre-Owned Vehicles in Canada | Planet Motors",
    description: "Browse Aviloo-certified used EVs, hybrids, and SUVs. 210-point inspected. Canada-wide delivery. Financing from 6.29% APR.",
    url: "/inventory",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Used EVs & Certified Pre-Owned | Planet Motors",
    description: "Aviloo-certified used EVs. 210-point inspected. Canada-wide delivery.",
  },
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
