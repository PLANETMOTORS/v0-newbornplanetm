import Script from "next/script"
import { calculateAllInPrice } from "@/lib/pricing/format"
import { getPublicSiteUrl } from "@/lib/site-url"
import { DEALERSHIP_LOCATION, OPENING_HOURS_SPECIFICATION, PHONE_TOLL_FREE_TEL, PHONE_LOCAL_TEL, EMAIL_INFO } from "@/lib/constants/dealership"
import { RATE_FLOOR_DISPLAY } from "@/lib/rates"

// Resolve site URL once per render instead of hardcoding
const SITE_URL = getPublicSiteUrl()

/** Safely join a relative path onto SITE_URL using the URL API. */
const toAbsoluteUrl = (value: string) => new URL(value, SITE_URL).toString()

// Organization Schema - for the business
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_URL}/#organization`,
    "name": "Planet Motors",
    "legalName": "Planet Motors Inc.",
    "foundingDate": "2015",
    "url": SITE_URL,
    "logo": `${SITE_URL}/images/planet-motors-logo.png`,
    "image": `${SITE_URL}/images/dealership.jpg`,
    "description": "Canada's trusted destination for premium pre-owned vehicles with nationwide delivery. 210-point inspection, 10-day money-back guarantee, and competitive multi-lender financing.",
    "telephone": PHONE_TOLL_FREE_TEL,
    "email": EMAIL_INFO,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": DEALERSHIP_LOCATION.streetAddress,
      "addressLocality": DEALERSHIP_LOCATION.city,
      "addressRegion": DEALERSHIP_LOCATION.province,
      "postalCode": DEALERSHIP_LOCATION.postalCode,
      "addressCountry": DEALERSHIP_LOCATION.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": DEALERSHIP_LOCATION.lat,
      "longitude": DEALERSHIP_LOCATION.lng
    },
    "openingHoursSpecification": OPENING_HOURS_SPECIFICATION,
    "priceRange": "$$",
    "currenciesAccepted": "CAD",
    "paymentAccepted": "Cash, Credit Card, Debit Card, Financing",
    "areaServed": {
      "@type": "Country",
      "name": "Canada"
    },
    "sameAs": [
      "https://www.facebook.com/people/Planet-Motors/61563743413155/",
      "https://www.instagram.com/planetmotors.ca",
      "https://www.youtube.com/@PlanetMotors_ca",
      "https://www.tiktok.com/@planetmotors.ca",
      "https://x.com/planetmotors_ca"
    ],
    "owns": {
      "@id": `${SITE_URL}/#website`
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Vehicle Inventory",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Electric Vehicles",
          "url": `${SITE_URL}/inventory?fuelType=Electric`
        },
        {
          "@type": "OfferCatalog",
          "name": "SUVs",
          "url": `${SITE_URL}/inventory?bodyType=SUV`
        },
        {
          "@type": "OfferCatalog",
          "name": "Sedans",
          "url": `${SITE_URL}/inventory?bodyType=Sedan`
        },
        {
          "@type": "OfferCatalog",
          "name": "Trucks",
          "url": `${SITE_URL}/inventory?bodyType=Truck`
        }
      ]
    }
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Vehicle Schema - for individual vehicle pages
interface VehicleJsonLdProps {
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    mileage: number
    vin?: string
    color?: string
    fuelType?: string
    transmission?: string
    engine?: string
    drivetrain?: string
    bodyStyle?: string
    stockNumber?: string
    image: string
    description?: string
    condition?: string
  }
}

/** Infer number of doors from body style. */
function inferNumberOfDoors(bodyStyle?: string): number | undefined {
  if (!bodyStyle) return undefined
  const bs = bodyStyle.toLowerCase()
  if (bs.includes("coupe")) return 2
  if (bs.includes("sedan")) return 4
  if (bs.includes("suv") || bs.includes("crossover")) return 4
  if (bs.includes("truck") || bs.includes("pickup")) return 4
  if (bs.includes("hatchback")) return 4
  if (bs.includes("van") || bs.includes("minivan")) return 4
  return undefined
}

/** Infer seating capacity from body style. */
function inferSeatingCapacity(bodyStyle?: string): number | undefined {
  if (!bodyStyle) return undefined
  const bs = bodyStyle.toLowerCase()
  if (bs.includes("coupe")) return 4
  if (bs.includes("sedan")) return 5
  if (bs.includes("suv") || bs.includes("crossover")) return 5
  if (bs.includes("truck") || bs.includes("pickup")) return 5
  if (bs.includes("hatchback")) return 5
  if (bs.includes("van") || bs.includes("minivan")) return 7
  return undefined
}

/** Map drivetrain value to schema.org DriveWheelConfigurationValue. */
function mapDriveWheelConfiguration(drivetrain?: string): string | undefined {
  if (!drivetrain) return undefined
  const dt = drivetrain.toUpperCase()
  if (dt === "FWD" || dt.includes("FRONT")) return "https://schema.org/FrontWheelDriveConfiguration"
  if (dt === "RWD" || dt.includes("REAR")) return "https://schema.org/RearWheelDriveConfiguration"
  if (dt === "AWD" || dt === "4WD" || dt.includes("ALL")) return "https://schema.org/AllWheelDriveConfiguration"
  if (dt.includes("FOUR") || dt.includes("4X4")) return "https://schema.org/FourWheelDriveConfiguration"
  return drivetrain
}

export function VehicleJsonLd({ vehicle }: VehicleJsonLdProps) {
  // Use OMVIC all-in price (subtotal before HST) for the advertised price
  const allInPrice = calculateAllInPrice(vehicle.price)

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim(),
    "description": vehicle.description || `${vehicle.year} ${vehicle.make} ${vehicle.model} for sale at Planet Motors`,
    "brand": {
      "@type": "Brand",
      "name": vehicle.make
    },
    "model": vehicle.model,
    "vehicleModelDate": vehicle.year.toString(),
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": vehicle.mileage,
      "unitCode": "KMT"
    },
    "vehicleIdentificationNumber": vehicle.vin,
    "color": vehicle.color,
    "fuelType": vehicle.fuelType,
    "vehicleTransmission": vehicle.transmission,
    "itemCondition": vehicle.condition === "new"
      ? "https://schema.org/NewCondition"
      : "https://schema.org/UsedCondition",
    "image": toAbsoluteUrl(vehicle.image),
    "url": `${SITE_URL}/vehicles/${vehicle.id}`,
    "offers": {
      "@type": "Offer",
      "price": allInPrice.subtotal,
      "priceCurrency": "CAD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": allInPrice.subtotal,
        "priceCurrency": "CAD",
        "valueAddedTaxIncluded": false
      },
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "AutoDealer",
        "name": "Planet Motors",
        "url": SITE_URL
      },
      "warranty": {
        "@type": "WarrantyPromise",
        "warrantyScope": "10-Day Money Back Guarantee"
      }
    }
  }

  // Add enriched schema.org/Car fields when data is available
  if (vehicle.engine) {
    schema["vehicleEngine"] = {
      "@type": "EngineSpecification",
      "name": vehicle.engine
    }
  }

  const driveConfig = mapDriveWheelConfiguration(vehicle.drivetrain)
  if (driveConfig) {
    schema["driveWheelConfiguration"] = driveConfig
  }

  const doors = inferNumberOfDoors(vehicle.bodyStyle)
  if (doors) {
    schema["numberOfDoors"] = doors
  }

  const seating = inferSeatingCapacity(vehicle.bodyStyle)
  if (seating) {
    schema["vehicleSeatingCapacity"] = seating
  }

  return (
    <Script
      id={`vehicle-jsonld-${vehicle.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQ Schema - for FAQ page
interface FAQJsonLdProps {
  faqs: Array<{ question: string; answer: string }>
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Blog Article Schema
interface ArticleJsonLdProps {
  article: {
    title: string
    slug: string
    publishedAt: string
    modifiedAt?: string
    excerpt: string
    coverImage: string
    author?: string
  }
}

export function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt,
    "image": toAbsoluteUrl(article.coverImage),
    "datePublished": article.publishedAt,
    "dateModified": article.modifiedAt || article.publishedAt,
    "author": {
      "@type": "Organization",
      "name": article.author || "Planet Motors"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Planet Motors",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/images/planet-motors-logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`
    }
  }

  return (
    <Script
      id={`article-jsonld-${article.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Breadcrumb Schema
interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": toAbsoluteUrl(item.url)
    }))
  }

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Financial Service Schema - for financing page
export function FinancialServiceJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Planet Motors Auto Financing",
    "description": "Get pre-approved for auto financing in minutes. Compare rates from 20+ major Canadian lenders with no impact on your credit score.",
    "url": `${SITE_URL}/financing`,
    "provider": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": SITE_URL,
      "@id": `${SITE_URL}/#organization`
    },
    "areaServed": {
      "@type": "Country",
      "name": "Canada"
    },
    "serviceType": "Auto Financing",
    "offers": {
      "@type": "Offer",
      "description": `Auto loan rates starting from ${RATE_FLOOR_DISPLAY} APR with terms from 24 to 96 months`,
      "priceCurrency": "CAD"
    },
    "telephone": PHONE_TOLL_FREE_TEL,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": DEALERSHIP_LOCATION.streetAddress,
      "addressLocality": DEALERSHIP_LOCATION.city,
      "addressRegion": DEALERSHIP_LOCATION.province,
      "postalCode": DEALERSHIP_LOCATION.postalCode,
      "addressCountry": DEALERSHIP_LOCATION.country
    }
  }

  return (
    <Script
      id="financial-service-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Contact Page Schema - for contact page
export function ContactPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": "Planet Motors",
    "url": `${SITE_URL}/contact`,
    "@id": `${SITE_URL}/#organization`,
    "telephone": PHONE_TOLL_FREE_TEL,
    "email": EMAIL_INFO,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": DEALERSHIP_LOCATION.streetAddress,
      "addressLocality": DEALERSHIP_LOCATION.city,
      "addressRegion": DEALERSHIP_LOCATION.province,
      "postalCode": DEALERSHIP_LOCATION.postalCode,
      "addressCountry": DEALERSHIP_LOCATION.country
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": PHONE_TOLL_FREE_TEL,
        "contactType": "sales",
        "email": "sales@planetmotors.ca",
        "availableLanguage": "English",
        "hoursAvailable": OPENING_HOURS_SPECIFICATION[0]
      },
      {
        "@type": "ContactPoint",
        "telephone": PHONE_LOCAL_TEL,
        "contactType": "customer service",
        "email": EMAIL_INFO,
        "availableLanguage": "English"
      }
    ],
    "openingHoursSpecification": OPENING_HOURS_SPECIFICATION
  }

  return (
    <Script
      id="contact-page-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Website Search Action (for Google Sitelinks Searchbox)
export function WebsiteSearchJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "name": "Planet Motors",
    "url": SITE_URL,
    "inLanguage": "en-CA",
    "publisher": {
      "@id": `${SITE_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/inventory?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <Script
      id="website-search-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}


export function InventoryPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Pre-Owned Vehicle Inventory | Planet Motors",
    "description": "Browse our certified pre-owned vehicle inventory. Quality inspected vehicles with warranty and financing available.",
    "url": `${SITE_URL}/inventory`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Planet Motors",
      "url": SITE_URL
    },
    "provider": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": SITE_URL
    }
  }

  return (
    <Script
      id="inventory-page-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function TradeInPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Vehicle Trade-In Valuation",
    "description": "Get an instant trade-in value for your vehicle. Fair market pricing powered by Canadian Black Book.",
    "url": `${SITE_URL}/trade-in`,
    "provider": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": SITE_URL,
      "telephone": PHONE_TOLL_FREE_TEL
    },
    "serviceType": "Vehicle Trade-In"
  }

  return (
    <Script
      id="trade-in-page-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WarrantyPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Planet Motors Vehicle Warranty",
    "description": "Comprehensive warranty coverage for your certified pre-owned vehicle purchase.",
    "url": `${SITE_URL}/protection-plans`,
    "brand": {
      "@type": "Brand",
      "name": "Planet Motors"
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "CAD"
    }
  }

  return (
    <Script
      id="warranty-page-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}