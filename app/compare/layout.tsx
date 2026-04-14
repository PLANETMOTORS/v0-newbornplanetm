import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compare Vehicles | Planet Motors - Side-by-Side Comparison",
  description: "Compare vehicles side by side at Planet Motors. Compare specs, features, pricing, and more to find the perfect car for you.",
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
