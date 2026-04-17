import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Inventory | Planet Motors - Certified Pre-Owned Vehicles",
  description: "Shop certified pre-owned vehicles at Planet Motors. Free Carfax, 210-point inspection, nationwide delivery. Filter by make, model, price, fuel type, and more.",
  keywords: [
    "used cars Ontario",
    "certified pre-owned vehicles",
    "used car dealership",
    "electric vehicles for sale",
    "used Tesla Canada",
    "used BMW Ontario",
    "car inventory Richmond Hill",
    "Planet Motors inventory",
  ].join(", "),
  alternates: {
    canonical: "/inventory",
  },
  openGraph: {
    title: "Browse Inventory | Planet Motors - Certified Pre-Owned",
    description: "Shop certified pre-owned vehicles with free Carfax, 210-point inspection, and nationwide delivery across Canada.",
    url: "/inventory",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Inventory | Planet Motors",
    description: "Certified pre-owned vehicles with free Carfax and 210-point inspection. Nationwide delivery.",
  },
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
