import type { Metadata } from "next"

const BASE_URL = "https://www.planetmotors.ca"

const cityData: Record<string, { name: string; region: string }> = {
  "toronto": { name: "Toronto", region: "Ontario" },
  "richmond-hill": { name: "Richmond Hill", region: "Ontario" },
  "markham": { name: "Markham", region: "Ontario" },
  "vaughan": { name: "Vaughan", region: "Ontario" },
  "mississauga": { name: "Mississauga", region: "Ontario" },
  "brampton": { name: "Brampton", region: "Ontario" },
  "scarborough": { name: "Scarborough", region: "Ontario" },
  "north-york": { name: "North York", region: "Ontario" },
  "oakville": { name: "Oakville", region: "Ontario" },
  "hamilton": { name: "Hamilton", region: "Ontario" },
  "ottawa": { name: "Ottawa", region: "Ontario" },
  "montreal": { name: "Montreal", region: "Quebec" },
  "vancouver": { name: "Vancouver", region: "British Columbia" },
  "calgary": { name: "Calgary", region: "Alberta" },
  "edmonton": { name: "Edmonton", region: "Alberta" },
}

export function generateStaticParams() {
  return Object.keys(cityData).map(city => ({ city }))
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = cityData[params.city] || { 
    name: params.city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    region: "Canada"
  }

  const title = `Used Cars for Sale in ${city.name} | Planet Motors`
  const description = `Browse 9,500+ certified pre-owned vehicles available for delivery to ${city.name}, ${city.region}. 210-point inspection, 10-day money-back guarantee, competitive financing. Shop online and get your car delivered!`

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
      canonical: `${BASE_URL}/used-cars/${params.city}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/used-cars/${params.city}`,
      siteName: "Planet Motors",
      locale: "en_CA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
