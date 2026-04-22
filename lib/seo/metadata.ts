import type { Metadata } from "next"
import { getPublicSiteUrl } from "@/lib/site-url"

const BASE_URL = getPublicSiteUrl()
const SITE_NAME = "Planet Motors"
const DEFAULT_DESCRIPTION = "Canada's EV-focused used car dealership. Every electric vehicle independently battery-certified by Aviloo. OMVIC licensed, 210-point inspected, Canada-wide delivery. Financing from 6.29% APR."

interface GenerateMetadataParams {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
}

export function generateSEOMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = "/images/planet-motors-logo.png",
  noIndex = false,
  keywords = [],
}: GenerateMetadataParams): Metadata {
  const fullTitle = title === "Home" ? `${SITE_NAME} Richmond Hill | Aviloo-Certified Used EVs | Canada-Wide Delivery` : `${title} | ${SITE_NAME}`
  const url = `${BASE_URL}${path}`
  const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`

  const defaultKeywords = [
    "used EVs Canada",
    "Aviloo certified",
    "pre-owned electric vehicles",
    "car dealership Richmond Hill",
    "Canada-wide delivery",
    "OMVIC licensed",
    "EV battery health",
    "financing",
    "trade-in",
  ]

  return {
    title: fullTitle,
    description,
    keywords: [...defaultKeywords, ...keywords].join(", "),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      telephone: true,
      email: true,
      address: true,
    },
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_CA",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@planetmotors",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  }
}

// Pre-built metadata for common pages
export const pageMetadata = {
  home: generateSEOMetadata({
    title: "Home",
    path: "/",
    keywords: ["buy car online", "online car shopping", "virtual car showroom"],
  }),

  inventory: generateSEOMetadata({
    title: "Used EVs & Certified Pre-Owned Vehicles in Canada",
    description: "Browse Aviloo-certified used EVs, hybrids, and SUVs. 210-point inspected, free Carfax. Canada-wide delivery. Financing from 6.29% APR.",
    path: "/inventory",
    keywords: ["car inventory", "used EVs for sale", "Aviloo certified", "search cars"],
  }),

  financing: generateSEOMetadata({
    title: "Used Car Financing in Canada | Rates from 6.29% APR",
    description: "Compare rates from 20+ Canadian lenders. Soft credit check, pre-approval in 30 minutes. All credit types welcome. O.A.C.",
    path: "/financing",
    keywords: ["auto financing", "car loan", "pre-approval", "6.29% APR", "Canadian lenders"],
  }),

  tradeIn: generateSEOMetadata({
    title: "Sell or Trade Your Vehicle in Canada | Instant Offer",
    description: "Get a competitive offer in 60 seconds. Canadian Black Book valuation. Same-day payment available. No obligation, no hidden fees.",
    path: "/trade-in",
    keywords: ["trade in car", "sell my car", "car valuation", "instant cash offer", "Canadian Black Book"],
  }),

  about: generateSEOMetadata({
    title: "About Planet Motors | OMVIC Licensed Used EV Dealership Richmond Hill",
    description: "Canada's EV-focused used car dealership. Aviloo battery-certified. OMVIC licensed. Family-operated since 2015. 210-point inspection on every vehicle.",
    path: "/about",
    keywords: ["OMVIC licensed", "Aviloo certified", "dealership history", "customer reviews"],
  }),

  contact: generateSEOMetadata({
    title: "Contact Planet Motors | Richmond Hill Ontario Dealership",
    description: "Visit us at 30 Major Mackenzie Dr E, Richmond Hill. Call 1-866-797-3332. Mon–Fri 9AM–7PM, Sat 9AM–6PM.",
    path: "/contact",
    keywords: ["contact dealer", "dealership location", "phone number", "dealership hours"],
  }),

  faq: generateSEOMetadata({
    title: "Frequently Asked Questions",
    description: "Find answers to common questions about buying, financing, delivery, warranty, and trade-ins at Planet Motors.",
    path: "/faq",
    keywords: ["FAQ", "car buying questions", "financing FAQ", "delivery FAQ"],
  }),

  blog: generateSEOMetadata({
    title: "Blog & News",
    description: "Stay informed with the latest automotive news, EV guides, car buying tips, and industry insights from Planet Motors.",
    path: "/blog",
    keywords: ["automotive blog", "car news", "EV guides", "buying tips"],
  }),

  delivery: generateSEOMetadata({
    title: "Nationwide Delivery",
    description: "Free delivery within 300km. Affordable shipping anywhere in Canada. Track your vehicle from purchase to doorstep delivery.",
    path: "/delivery",
    keywords: ["car delivery", "nationwide shipping", "free delivery", "home delivery"],
  }),

  protectionPlans: generateSEOMetadata({
    title: "Vehicle Protection Plans | Warranty Coverage",
    description: "Bumper-to-bumper warranty coverage starting from $1,950. Plans from $29/month. Optional zero-deductible coverage. Fully transferable.",
    path: "/protection-plans",
    keywords: ["extended warranty", "vehicle protection", "GAP insurance", "zero deductible"],
  }),

  evBatteryHealth: generateSEOMetadata({
    title: "Aviloo Battery Certification",
    description: "Every used EV at Planet Motors includes an independent Aviloo FLASH Test battery certification with documented State of Health, usable capacity, and WLTP range projection.",
    path: "/aviloo",
    keywords: ["Aviloo certification", "EV battery health", "battery State of Health", "FLASH Test"],
  }),
}

// Generate vehicle-specific metadata
export function generateVehicleMetadata(vehicle: {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  price: number
  mileage: number
  image: string
  description?: string
}): Metadata {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim()
  const description = vehicle.description || 
    `${title} for sale at Planet Motors. ${vehicle.mileage.toLocaleString()} km. $${vehicle.price.toLocaleString()} CAD. 210-point inspected with CARFAX report. Nationwide delivery available.`

  return generateSEOMetadata({
    title,
    description,
    path: `/vehicles/${vehicle.id}`,
    image: vehicle.image,
    keywords: [
      vehicle.make,
      vehicle.model,
      `${vehicle.year} ${vehicle.make}`,
      `used ${vehicle.make} ${vehicle.model}`,
      `buy ${vehicle.make}`,
    ],
  })
}

// Generate blog article metadata
export function generateArticleMetadata(article: {
  title: string
  slug: string
  excerpt: string
  coverImage: string
  publishedAt: string
  author?: string
}): Metadata {
  const metadata = generateSEOMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    image: article.coverImage,
  })

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: article.publishedAt,
      authors: article.author ? [article.author] : ["Planet Motors"],
    },
  }
}
