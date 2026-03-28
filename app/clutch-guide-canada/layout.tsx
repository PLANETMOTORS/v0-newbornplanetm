import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clutch Guide Canada | Clutch Replacement Cost, Clutch Cars & Repair | Planet Motors",
  description: "Complete clutch guide for Canadian drivers. Learn about clutch replacement costs in Canada, clutch problems, manual transmission cars, and clutch repair services. Expert advice from Planet Motors.",
  keywords: [
    "clutch",
    "clutch canada", 
    "clutch cars",
    "clutch auto",
    "clutch replacement canada",
    "clutch repair near me",
    "manual transmission cars canada",
    "clutch cost ontario",
    "clutch problems",
    "car clutch replacement",
    "best manual cars canada",
    "clutch slipping",
    "how long does a clutch last"
  ],
  openGraph: {
    title: "Clutch Guide Canada | Complete Clutch Information | Planet Motors",
    description: "Everything Canadians need to know about clutch systems, replacement costs, manual transmission cars, and clutch repair services across Canada.",
    url: "https://www.planetmotors.ca/clutch-guide-canada",
    siteName: "Planet Motors",
    locale: "en_CA",
    type: "article",
  },
  alternates: {
    canonical: "https://www.planetmotors.ca/clutch-guide-canada",
  },
}

export default function ClutchGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
