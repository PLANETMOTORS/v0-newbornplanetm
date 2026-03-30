// Advanced SEO Utilities for Planet Motors

export const DOMAIN = "www.planetmotors.ca"
export const BASE_URL = `https://${DOMAIN}`

// Long-tail keyword clusters - targeting specific buyer intent
export const keywordClusters = {
  evBuyers: [
    "used Tesla Toronto",
    "certified pre-owned Tesla Model 3",
    "buy electric car Ontario",
    "EV battery health report Canada",
    "used Porsche Taycan for sale",
    "electric SUV Canada",
    "Tesla Model Y certified",
    "affordable electric cars Canada",
    "EV financing Canada",
    "used EV dealership Ontario",
  ],
  luxuryBuyers: [
    "certified pre-owned BMW Toronto",
    "used Mercedes-Benz GTA",
    "luxury cars Richmond Hill",
    "used Porsche dealer Ontario",
    "Audi certified pre-owned",
    "luxury SUV Canada",
    "premium used cars Ontario",
  ],
  valueSeeker: [
    "best used car deals Toronto",
    "affordable used cars Ontario",
    "cheap reliable cars Canada",
    "used Honda CRV Toronto",
    "used Toyota RAV4 Ontario",
    "budget friendly cars GTA",
  ],
  financing: [
    "bad credit car loan Ontario",
    "car financing no credit check",
    "auto loan pre-approval Canada",
    "zero down car financing",
    "second chance auto financing",
    "car loan calculator Canada",
  ],
  tradeIn: [
    "trade in car Toronto",
    "sell my car Richmond Hill",
    "Canadian Black Book value",
    "instant car offer Ontario",
    "car appraisal near me",
  ],
  delivery: [
    "car delivery Ontario",
    "buy car online Canada",
    "home delivery car purchase",
    "nationwide car shipping Canada",
  ],
}

// Geographic targeting keywords
export const geoKeywords = {
  primary: ["Toronto", "Richmond Hill", "GTA", "Ontario"],
  secondary: ["Markham", "Vaughan", "Mississauga", "Scarborough", "North York", "Brampton"],
  provincial: ["Ontario", "Quebec", "British Columbia", "Alberta"],
  national: ["Canada", "Canadian"],
}

// Generate location-specific landing page slugs
export function generateLocationSlugs(): string[] {
  const cities = [
    "toronto", "richmond-hill", "markham", "vaughan", "mississauga",
    "scarborough", "north-york", "brampton", "oakville", "hamilton",
    "ottawa", "montreal", "vancouver", "calgary", "edmonton"
  ]
  
  const categories = ["used-cars", "electric-vehicles", "car-financing", "trade-in"]
  
  const slugs: string[] = []
  cities.forEach(city => {
    categories.forEach(category => {
      slugs.push(`/${category}/${city}`)
    })
  })
  
  return slugs
}

// High-value keyword opportunities
export const keywordOpportunities = [
  "online car buying canada review",
  "buy car without dealer",
  "best online car dealership canada",
  "trusted used car dealer ontario",
]

// Content topics for blog SEO
export const blogTopics = {
  evGuides: [
    "Complete Guide to Buying a Used Tesla in Canada 2026",
    "EV Battery Health: What Every Buyer Needs to Know",
    "Top 10 Electric Vehicles Under $50,000 in Canada",
    "EV Incentives and Rebates in Ontario 2026",
    "How to Evaluate EV Battery Degradation Before Buying",
  ],
  buyingGuides: [
    "First-Time Car Buyer Guide: Everything You Need to Know",
    "How to Spot a Good Deal on a Used Car",
    "Understanding Vehicle History Reports: CARFAX Explained",
    "Certified Pre-Owned vs Used: Which is Right for You?",
    "Top 10 Most Reliable Used Cars in Canada 2026",
  ],
  financingGuides: [
    "Complete Guide to Auto Financing in Canada",
    "How to Get a Car Loan with Bad Credit",
    "Understanding Interest Rates: Fixed vs Variable",
    "Down Payment Strategies: How Much Should You Put Down?",
    "Lease vs Finance: Complete Comparison Guide",
  ],
  tradeInGuides: [
    "How to Maximize Your Trade-In Value",
    "Best Time of Year to Trade In Your Car",
    "Understanding Canadian Black Book Values",
    "Private Sale vs Trade-In: Pros and Cons",
  ],
}

// Schema.org Product aggregate data
export function generateProductAggregateSchema(inventory: {
  totalCount: number
  minPrice: number
  maxPrice: number
  avgRating: number
  reviewCount: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Planet Motors Vehicle Inventory",
    "description": `Browse ${inventory.totalCount}+ certified pre-owned vehicles at Planet Motors`,
    "url": `${BASE_URL}/inventory`,
    "numberOfItems": inventory.totalCount,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": inventory.minPrice,
      "highPrice": inventory.maxPrice,
      "priceCurrency": "CAD",
      "offerCount": inventory.totalCount,
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": inventory.avgRating,
      "reviewCount": inventory.reviewCount,
      "bestRating": 5,
      "worstRating": 1,
    },
  }
}

// Video schema for vehicle walkarounds
export function generateVideoSchema(video: {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  duration: string // ISO 8601 format
  contentUrl: string
  vehicleId: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "contentUrl": video.contentUrl,
    "embedUrl": `${BASE_URL}/vehicles/${video.vehicleId}#video`,
    "publisher": {
      "@type": "Organization",
      "name": "Planet Motors",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/images/planet-motors-logo.png`,
      },
    },
  }
}

// Review schema with seller rating
export function generateReviewSchema(reviews: Array<{
  author: string
  datePublished: string
  reviewBody: string
  ratingValue: number
  vehiclePurchased?: string
}>) {
  return reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author,
    },
    "datePublished": review.datePublished,
    "reviewBody": review.reviewBody,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.ratingValue,
      "bestRating": 5,
      "worstRating": 1,
    },
    "itemReviewed": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": BASE_URL,
    },
  }))
}

// HowTo schema for guides
export function generateHowToSchema(howTo: {
  name: string
  description: string
  totalTime?: string
  steps: Array<{ name: string; text: string; image?: string }>
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howTo.name,
    "description": howTo.description,
    "totalTime": howTo.totalTime,
    "step": howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image,
    })),
  }
}

// Service schema for offerings
export function generateServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Auto Sales",
    "provider": {
      "@type": "AutoDealer",
      "name": "Planet Motors",
      "url": BASE_URL,
    },
    "areaServed": {
      "@type": "Country",
      "name": "Canada",
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Planet Motors Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Vehicle Sales",
            "description": "Certified pre-owned vehicles with 210-point inspection",
          },
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Auto Financing",
            "description": "Competitive rates from multiple lenders",
          },
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Trade-In Valuation",
            "description": "Instant offers powered by Canadian Black Book",
          },
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nationwide Delivery",
            "description": "Free delivery within 300km, affordable shipping Canada-wide",
          },
        },
      ],
    },
  }
}

// Event schema for sales/promotions
export function generateEventSchema(event: {
  name: string
  description: string
  startDate: string
  endDate: string
  location?: string
  offers?: { price: string; description: string }
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SaleEvent",
    "name": event.name,
    "description": event.description,
    "startDate": event.startDate,
    "endDate": event.endDate,
    "location": {
      "@type": "Place",
      "name": event.location || "Planet Motors",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "30 Major Mackenzie Dr E",
        "addressLocality": "Richmond Hill",
        "addressRegion": "ON",
        "postalCode": "L4C 1G7",
        "addressCountry": "CA",
      },
    },
    "organizer": {
      "@type": "Organization",
      "name": "Planet Motors",
      "url": BASE_URL,
    },
    "offers": event.offers ? {
      "@type": "Offer",
      "price": event.offers.price,
      "description": event.offers.description,
      "priceCurrency": "CAD",
    } : undefined,
  }
}

// Core Web Vitals recommendations
export const performanceOptimizations = {
  images: {
    format: "webp",
    lazy: true,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    priority: ["hero", "firstVehicle", "logo"],
  },
  fonts: {
    display: "swap",
    preload: ["Inter-400", "Inter-600", "Inter-700"],
  },
  scripts: {
    defer: ["analytics", "chatWidget", "socialProof"],
    async: ["gtm"],
  },
}
