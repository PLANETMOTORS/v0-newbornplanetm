// Planet Motors CMS - Data Fetching v14
import { sanityClient } from "./client"
import type {
  SiteSettings,
  Navigation,
  HomepageData,
  SellYourCarPage,
  FinancingPage,
  InventorySettings,
  Vehicle,
  BlogPost,
  FaqEntry,
  Promotion,
  Testimonial,
  ProtectionPlan,
  Lender,
} from "./types"

// GROQ Queries - inline definitions
const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] { dealerName, phone, email, streetAddress, city, province, postalCode, latitude, longitude, omvicNumber, businessHours, facebookUrl, instagramUrl, twitterUrl, youtubeUrl, googleMapsEmbedUrl, announcementBar, mainNavigation, financingDefaults, deliveryConfiguration, aggregateRating, defaultSeo, leadRoutingRules, depositAmount }`

const NAVIGATION_QUERY = `*[_type == "navigation"][0] { topBar { showTopBar, phoneNumber, phoneDisplayText, address, addressLink, trustBadges }, mainNavigation, headerCta { showCta, buttonLabel, buttonUrl, buttonStyle }, footerLinkColumns, footerBottom { copyrightText, legalLinks } }`

const HOMEPAGE_QUERY = `*[_type == "homepage"][0] { heroSection { headline, subheadline, primaryCta, secondaryCta, "backgroundImage": backgroundImage.asset->url, altText, trustBadges }, featuredVehicleStockNumbers, promoBanner { showBanner, headline, bodyText, ctaLabel, ctaUrl, backgroundColor }, testimonials, faqHighlights }`

const SELL_YOUR_CAR_PAGE_QUERY = `*[_type == "sellYourCar"][0] { heroSection { headline, subheadline, highlightText, formSettings, trustBadges, "backgroundImage": backgroundImage.asset->url }, benefits, comparisonTable, processSteps, testimonials, ctaSection, seo }`

const FINANCING_PAGE_QUERY = `*[_type == "financing"][0] { heroSection { headline, subheadline, featuredRateText, rateSubtext, primaryCta, secondaryCta, heroStats }, lenders, calculator, processSteps, benefits, faqs, seo }`

const INVENTORY_SETTINGS_QUERY = `*[_type == "inventorySettings"][0] { displaySettings { pageTitle, pageSubtitle, defaultView, itemsPerPage, showFiltersSidebar }, filterConfiguration, sortingOptions, vehicleBadges, seo }`

const VEHICLES_QUERY = `*[_type == "vehicle" && status == "available"] | order(_createdAt desc) { _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice, status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle, fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange, batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url, "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners, accidentFree, serviceHistory, slug, seoTitle, seoDescription }`

const VEHICLE_BY_SLUG_QUERY = `*[_type == "vehicle" && slug.current == $slug][0] { _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice, status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle, fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange, batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url, "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners, accidentFree, serviceHistory, slug, seoTitle, seoDescription }`

const FEATURED_VEHICLES_QUERY = `*[_type == "vehicle" && featured == true && status == "available"] | order(_createdAt desc)[0...8] { _id, year, make, model, trim, price, mileage, fuelType, "mainImage": mainImage.asset->url, slug }`

const VEHICLES_BY_STOCK_NUMBERS_QUERY = `*[_type == "vehicle" && stockNumber in $stockNumbers && status == "available"] { _id, year, make, model, trim, price, mileage, fuelType, "mainImage": mainImage.asset->url, slug, stockNumber }`

const BLOG_LIST_QUERY = `*[_type == "blogPost"] | order(publishedAt desc)[$start...$end] { _id, title, slug, publishedAt, excerpt, "coverImage": coverImage.asset->url, seoTitle, seoDescription }`

const BLOG_COUNT_QUERY = `count(*[_type == "blogPost"])`

const BLOG_POST_QUERY = `*[_type == "blogPost" && slug.current == $slug][0] { _id, title, slug, publishedAt, excerpt, "coverImage": coverImage.asset->url, body, seoTitle, seoDescription }`

const FAQ_QUERY = `*[_type == "faqItem"] | order(order asc, _createdAt desc) { _id, question, answer, category }`

const ACTIVE_PROMOS_QUERY = `*[_type == "promotion" && active == true && startDate <= now() && endDate >= now()] { _id, title, message, ctaLabel, ctaUrl, startDate, endDate }`

const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(order asc, _createdAt desc) { _id, "customerName": name, rating, "review": text, vehiclePurchased, location, "publishedAt": _createdAt, featured }`

const FEATURED_TESTIMONIALS_QUERY = `*[_type == "testimonial" && featured == true] | order(order asc, _createdAt desc)[0...6] { _id, "customerName": name, rating, "review": text, vehiclePurchased, location, "publishedAt": _createdAt }`

const PROTECTION_PLANS_QUERY = `*[_type == "protectionPlan"] | order(order asc) { _id, name, description, price, features, coverage, "icon": icon.asset->url }`

const LENDERS_QUERY = `*[_type == "lender"] | order(order asc) { _id, name, "logo": logo.asset->url, description, specialties, featured }`

// Cache tags for ISR revalidation
const CACHE_TAGS = {
  settings: "sanity-settings",
  homepage: "sanity-homepage",
  blog: "sanity-blog",
  faq: "sanity-faq",
  testimonials: "sanity-testimonials",
  promos: "sanity-promos",
  protection: "sanity-protection",
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await sanityClient.fetch(SITE_SETTINGS_QUERY, {}, {
      next: { tags: [CACHE_TAGS.settings], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch site settings:", error)
    return null
  }
}

export async function getHomepageData(): Promise<HomepageData | null> {
  try {
    return await sanityClient.fetch(HOMEPAGE_QUERY, {}, {
      next: { tags: [CACHE_TAGS.homepage], revalidate: 300 }
    })
  } catch (error) {
    console.error("Failed to fetch homepage data:", error)
    return null
  }
}

export async function getBlogPosts(page = 1, perPage = 12): Promise<{ posts: BlogPost[], total: number }> {
  try {
    const start = (page - 1) * perPage
    const end = start + perPage
    
    const [posts, total] = await Promise.all([
      sanityClient.fetch(BLOG_LIST_QUERY, { start, end }, {
        next: { tags: [CACHE_TAGS.blog], revalidate: 300 }
      }),
      sanityClient.fetch(BLOG_COUNT_QUERY, {}, {
        next: { tags: [CACHE_TAGS.blog], revalidate: 300 }
      }),
    ])
    
    return { posts: posts || [], total: total || 0 }
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)
    return { posts: [], total: 0 }
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await sanityClient.fetch(BLOG_POST_QUERY, { slug }, {
      next: { tags: [CACHE_TAGS.blog], revalidate: 300 }
    })
  } catch (error) {
    console.error("Failed to fetch blog post:", error)
    return null
  }
}

export async function getFaqs(): Promise<FaqEntry[]> {
  try {
    return await sanityClient.fetch(FAQ_QUERY, {}, {
      next: { tags: [CACHE_TAGS.faq], revalidate: 3600 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch FAQs:", error)
    return []
  }
}

export async function getActivePromos(): Promise<Promotion[]> {
  try {
    return await sanityClient.fetch(ACTIVE_PROMOS_QUERY, {}, {
      next: { tags: [CACHE_TAGS.promos], revalidate: 60 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch promos:", error)
    return []
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await sanityClient.fetch(TESTIMONIALS_QUERY, {}, {
      next: { tags: [CACHE_TAGS.testimonials], revalidate: 3600 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch testimonials:", error)
    return []
  }
}

export async function getProtectionPlans(): Promise<ProtectionPlan[]> {
  try {
    return await sanityClient.fetch(PROTECTION_PLANS_QUERY, {}, {
      next: { tags: [CACHE_TAGS.protection], revalidate: 3600 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch protection plans:", error)
    return []
  }
}

export async function getNavigation(): Promise<Navigation | null> {
  try {
    return await sanityClient.fetch(NAVIGATION_QUERY, {}, {
      next: { tags: [CACHE_TAGS.settings], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch navigation:", error)
    return null
  }
}

export async function getSellYourCarPage(): Promise<SellYourCarPage | null> {
  try {
    return await sanityClient.fetch(SELL_YOUR_CAR_PAGE_QUERY, {}, {
      next: { tags: ["sanity-sell-your-car"], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch sell your car page:", error)
    return null
  }
}

export async function getFinancingPage(): Promise<FinancingPage | null> {
  try {
    return await sanityClient.fetch(FINANCING_PAGE_QUERY, {}, {
      next: { tags: ["sanity-financing"], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch financing page:", error)
    return null
  }
}

export async function getInventorySettings(): Promise<InventorySettings | null> {
  try {
    return await sanityClient.fetch(INVENTORY_SETTINGS_QUERY, {}, {
      next: { tags: ["sanity-inventory-settings"], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch inventory settings:", error)
    return null
  }
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(VEHICLES_QUERY, {}, {
      next: { tags: ["sanity-vehicles"], revalidate: 300 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch vehicles:", error)
    return []
  }
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  try {
    return await sanityClient.fetch(VEHICLE_BY_SLUG_QUERY, { slug }, {
      next: { tags: ["sanity-vehicles"], revalidate: 300 }
    })
  } catch (error) {
    console.error("Failed to fetch vehicle:", error)
    return null
  }
}

export async function getFeaturedVehicles(): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(FEATURED_VEHICLES_QUERY, {}, {
      next: { tags: ["sanity-vehicles"], revalidate: 300 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch featured vehicles:", error)
    return []
  }
}

export async function getVehiclesByStockNumbers(stockNumbers: string[]): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(VEHICLES_BY_STOCK_NUMBERS_QUERY, { stockNumbers }, {
      next: { tags: ["sanity-vehicles"], revalidate: 300 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch vehicles by stock numbers:", error)
    return []
  }
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  try {
    return await sanityClient.fetch(FEATURED_TESTIMONIALS_QUERY, {}, {
      next: { tags: [CACHE_TAGS.testimonials], revalidate: 3600 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch featured testimonials:", error)
    return []
  }
}

export async function getLenders(): Promise<Lender[]> {
  try {
    return await sanityClient.fetch(LENDERS_QUERY, {}, {
      next: { tags: ["sanity-lenders"], revalidate: 3600 }
    }) || []
  } catch (error) {
    console.error("Failed to fetch lenders:", error)
    return []
  }
}

export { CACHE_TAGS }
