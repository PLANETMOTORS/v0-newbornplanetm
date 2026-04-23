import { Metadata } from "next"

export const metadata: Metadata = {
  title: "EV Battery Health Dashboard | Planet Motors",
  description: "View detailed EV battery health reports including State of Health, usable capacity, and range projections for certified pre-owned electric vehicles.",
  alternates: {
    canonical: "/ev-battery",
  },
}

export default function EVBatteryLayout({ children }: { children: React.ReactNode }) {
  return children
}
