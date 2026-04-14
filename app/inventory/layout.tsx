import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Inventory | Planet Motors - Certified Pre-Owned Vehicles",
  description: "Shop certified pre-owned vehicles at Planet Motors. Free Carfax, 210-point inspection, nationwide delivery. Filter by make, model, price, and more.",
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
