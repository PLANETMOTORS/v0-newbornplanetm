import Script from "next/script"

// Organization Schema - for the business
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": "https://www.planetmotors.ca/#organization",
    "name": "Planet Motors",
    "legalName": "Planet Motors Inc.",
    "foundingDate": "2015",
    "url": "https://www.planetmotors.ca",
    "logo": "https://www.planetmotors.ca/images/planet-motors-logo.png",
    "image": "https://www.planetmotors.ca/images/dealership.jpg",
    "description": "Canada's trusted destination for premium pre-owned vehicles with nationwide delivery. 210-point inspection, 10-day money-back guarantee, and competitive multi-lender financing.",
    "telephone": "+1-866-797-3332",
    "email": "info@planetmotors.ca",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "30 Major Mackenzie Dr E",
      "addressLocality": "Richmond Hill",
      "addressRegion": "ON",
      "postalCode": "L4C 1G7",
      "addressCountry": "CA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 43.8828,
      "longitude": -79.4375
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "21:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "10:00",
        "closes": "17:00"
      }
    ],
    "priceRange": "$$",
    "currenciesAccepted": "CAD",
    "paymentAccepted": "Cash, Credit Card, Debit Card, Financing",
    "areaServed": {
      "@type": "Country",
      "name": "Canada"
    },
    "sameAs": [
      "https://www.facebook.com/planetmotors",
      "https://www.instagram.com/planetmotors",
      "https://www.youtube.com/@planetmotors",
      "https://twitter.com/planetmotors"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Vehicle Inventory",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Electric Vehicles",
          "url": "https://www.planetmotors.ca/inventory?fuelType=Electric"
        },
        {
          "@type": "OfferCatalog",
          "name": "SUVs",
          "url": "https://www.planetmotors.ca/inventory?bodyType=SUV"
        },
        {
          "@type": "OfferCatalog",
          "name": "Sedans",
          "url": "https://www.planetmotors.ca/inventory?bodyType=Sedan"
        },
        {
          "@type": "OfferCatalog",
          "name": "Trucks",
          "url": "https://www.planetmotors.ca/inventory?bodyType=Truck"
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
    image: string
    description?: string
    condition?: string
  }
}

export function VehicleJsonLd({ vehicle }: VehicleJsonLdProps) {
  const schema = {
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
    "image": vehicle.image.startsWith("http") 
      ? vehicle.image 
      : `https://www.planetmotors.ca${vehicle.image}`,
    "url": `https://www.planetmotors.ca/vehicles/${vehicle.id}`,
    "offers": {
      "@type": "Offer",
      "price": vehicle.price,
      "priceCurrency": "CAD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "AutoDealer",
        "name": "Planet Motors",
        "url": "https://www.planetmotors.ca"
      },
      "warranty": {
        "@type": "WarrantyPromise",
        "warrantyScope": "10-Day Money Back Guarantee"
      }
    }
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
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.coverImage.startsWith("http") 
      ? article.coverImage 
      : `https://www.planetmotors.ca${article.coverImage}`,
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
        "url": "https://www.planetmotors.ca/images/planet-motors-logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.planetmotors.ca/blog/${article.slug}`
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
      "item": item.url.startsWith("http") ? item.url : `https://www.planetmotors.ca${item.url}`
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

// Local Business with Reviews
export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Planet Motors",
    "image": "https://www.planetmotors.ca/images/planet-motors-logo.png",
    "@id": "https://www.planetmotors.ca",
    "url": "https://www.planetmotors.ca",
    "telephone": "+1-866-797-3332",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "30 Major Mackenzie Dr E",
      "addressLocality": "Richmond Hill",
      "addressRegion": "ON",
      "postalCode": "L4C 1G7",
      "addressCountry": "CA"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "500"
    }
  }

  return (
    <Script
      id="local-business-jsonld"
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
    "name": "Planet Motors",
    "url": "https://www.planetmotors.ca",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.planetmotors.ca/inventory?search={search_term_string}"
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
