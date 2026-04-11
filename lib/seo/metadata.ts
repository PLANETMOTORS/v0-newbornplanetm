import type { Metadata } from "next"
import { getPublicSiteUrl } from "@/lib/site-url"

const BASE_URL = getPublicSiteUrl()
const SITE_NAME = "Planet Motors"
const DEFAULT_DESCRIPTION = "Canada's trusted destination for premium pre-owned vehicles with nationwide delivery. 210-point inspection, 10-day money-back guarantee, and competitive multi-lender financing."

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
  image = "/images/og-default.jpg",
  noIndex = false,
  keywords = [],
}: GenerateMetadataParams): Metadata {
  const fullTitle = title === "Home" ? `${SITE_NAME} | Premium Used Car Dealership` : `${title} | ${SITE_NAME}`
  const url = `${BASE_URL}${path}`
  const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`

  const defaultKeywords = [
    "used cars",
    "pre-owned vehicles",
    "car dealership",
    "Canada",
    "Ontario",
    "Toronto",
    "Richmond Hill",
    "financing",
    "trade-in",
    "nationwide delivery",
    "OMVIC licensed",
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
    title: "Vehicle Inventory",
    description: "Browse 9,500+ certified pre-owned vehicles. Filter by make, model, price, and more. Free CARFAX reports and nationwide delivery.",
    path: "/inventory",
    keywords: ["car inventory", "used cars for sale", "certified pre-owned", "search cars"],
  }),

  financing: generateSEOMetadata({
    title: "Auto Financing",
    description: "Get pre-approved for auto financing in minutes. Competitive rates from multiple lenders. All credit types welcome. No impact on credit score.",
    path: "/financing",
    keywords: ["auto financing", "car loan", "pre-approval", "bad credit financing", "zero down payment"],
  }),

  tradeIn: generateSEOMetadata({
    title: "Sell or Trade Your Vehicle",
    description: "Get an instant cash offer for your vehicle powered by Canadian Black Book. Trade in or sell outright. Fair market value guaranteed.",
    path: "/trade-in",
    keywords: ["trade in car", "sell my car", "car valuation", "instant cash offer", "Canadian Black Book"],
  }),

  about: generateSEOMetadata({
    title: "About Us",
    description: "Planet Motors is an OMVIC licensed dealership committed to fairness and integrity. Learn about our 210-point inspection and customer-first approach.",
    path: "/about",
    keywords: ["OMVIC licensed", "car dealer about", "dealership history", "customer reviews"],
  }),

  contact: generateSEOMetadata({
    title: "Contact Us",
    description: "Contact Planet Motors. Visit us at 30 Major Mackenzie Dr E, Richmond Hill. Call 1-866-797-3332 or email info@planetmotors.ca.",
    path: "/contact",
    keywords: ["contact dealer", "dealership location", "phone number", "email"],
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
    title: "Protection Plans & Warranty",
    description: "Comprehensive vehicle protection plans including extended warranty, GAP insurance, tire & wheel protection, and maintenance packages.",
    path: "/protection-plans",
    keywords: ["extended warranty", "vehicle protection", "GAP insurance", "maintenance plan"],
  }),

  evBatteryHealth: generateSEOMetadata({
    title: "EV Battery Health Reports",
    description: "Transparent battery health reports for all electric vehicles. Know the true range and condition before you buy.",
    path: "/ev-battery-health",
    keywords: ["EV battery health", "electric car battery", "battery degradation", "EV range"],
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
