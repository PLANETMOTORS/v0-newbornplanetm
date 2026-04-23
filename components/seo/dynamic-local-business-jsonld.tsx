import { headers } from "next/headers"
import { getPublicSiteUrl } from "@/lib/site-url"
import { DEALERSHIP_LOCATION, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

async function getGoogleReviewsData() {
  try {
    // Use internal API call for server-side rendering
    const headersList = await headers()
    const host = headersList.get("host") || "www.planetmotors.ca"
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
    
    const response = await fetch(`${protocol}://${host}/api/google-reviews`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })
    
    if (!response.ok) {
      throw new Error("Failed to fetch reviews")
    }
    
    return await response.json()
  } catch {
    // Fallback data
    return {
      rating: 4.8,
      reviewCount: 500
    }
  }
}

export async function DynamicLocalBusinessJsonLd() {
  const reviewsData = await getGoogleReviewsData()
  const siteUrl = getPublicSiteUrl()

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Planet Motors",
    "image": `${siteUrl}/images/planet-motors-logo.png`,
    "@id": `${siteUrl}/#local-business`,
    "url": siteUrl,
    "telephone": PHONE_TOLL_FREE_TEL,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": DEALERSHIP_LOCATION.streetAddress,
      "addressLocality": DEALERSHIP_LOCATION.city,
      "addressRegion": DEALERSHIP_LOCATION.province,
      "postalCode": DEALERSHIP_LOCATION.postalCode,
      "addressCountry": DEALERSHIP_LOCATION.country
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviewsData.rating.toString(),
      "reviewCount": reviewsData.reviewCount.toString()
    }
  }

  return (
    <script
      id="local-business-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
