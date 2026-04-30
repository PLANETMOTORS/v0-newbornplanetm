import type { Metadata } from "next"
import { getPublicSiteUrl } from "@/lib/site-url"
import { cityData } from "./city-data"

const SITE_URL = getPublicSiteUrl()

interface Props {
  children: React.ReactNode
  params: Promise<{ city: string }>
}

export function generateStaticParams() {
  return Object.keys(cityData).map((city) => ({ city }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = cityData[citySlug] || {
    name: citySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    region: "Canada",
  }

  const title = `Used Cars for Sale in ${city.name} | Planet Motors`
  const description = `Browse certified pre-owned vehicles available for delivery to ${city.name}, ${city.region}. 210-point inspection, 10-day money-back guarantee, competitive financing. Shop online at Planet Motors.`

  return {
    title,
    description,
    keywords: [
      `used cars ${city.name}`,
      `car dealership ${city.name}`,
      `buy car ${city.name}`,
      `${city.name} car dealer`,
      `certified pre-owned ${city.name}`,
      `car delivery ${city.name}`,
      `auto financing ${city.name}`,
      `electric cars ${city.name}`,
    ].join(", "),
    alternates: {
      canonical: `${SITE_URL}/used-cars/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/used-cars/${citySlug}`,
      siteName: "Planet Motors",
      locale: "en_CA",
      type: "website",
      images: [
        {
          url: `${SITE_URL}/brand/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Planet Motors - Used Cars in ${city.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/brand/og-image.png`],
    },
  }
}

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return children
}
