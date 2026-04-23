// Planet Motors CMS - Data Fetching v19
import { sanityClient } from "./client"
import { RATE_FLOOR } from "@/lib/rates"
import {
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
  HOMEPAGE_QUERY,
  SELL_YOUR_CAR_PAGE_QUERY,
  FINANCING_PAGE_QUERY,
  INVENTORY_SETTINGS_QUERY,
  VEHICLES_QUERY,
  VEHICLE_BY_SLUG_QUERY,
  FEATURED_VEHICLES_QUERY,
  VEHICLES_BY_STOCK_NUMBERS_QUERY,
  BLOG_LIST_QUERY,
  BLOG_COUNT_QUERY,
  BLOG_POST_QUERY,
  FAQ_QUERY,
  ACTIVE_PROMOS_QUERY,
  TESTIMONIALS_QUERY,
  FEATURED_TESTIMONIALS_QUERY,
  PROTECTION_PLANS_QUERY,
  LENDERS_QUERY,
} from "./queries"
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

// Combined query for vehicles with special financing resolved
const VEHICLES_WITH_FINANCING_QUERY = `{
  "vehicles": *[_type == "vehicle" && status == "available"] | order(price asc) {
    _id,
    year,
    make,
    model,
    trim,
    price,
    msrp,
    specialPrice,
    mileage,
    fuelType,
    transmission,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "images": images[].asset->url,
    condition,
    featured,
    // Resolve the specialFinance lender reference
    "specialFinance": specialFinance->{
      _id,
      name,
      "logo": logo.asset->url,
      promoRate,
      promoEndDate,
      minCreditScore
    }
  },
  "lenders": *[_type == "lender"] | order(order asc) {
    _id,
    name,
    "logo": logo.asset->url,
    promoRate,
    standardRate,
    promoEndDate,
    featured
  }
}`

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

// Combined fetch for vehicles with their special financing deals resolved
export async function getVehiclesWithFinancing(): Promise<{
  vehicles: (Vehicle & { specialFinance?: Lender | null })[];
  lenders: Lender[];
}> {
  try {
    const result = await sanityClient.fetch(VEHICLES_WITH_FINANCING_QUERY, {}, {
      next: { tags: ["sanity-vehicles", "sanity-lenders"], revalidate: 300 }
    })
    return {
      vehicles: result?.vehicles || [],
      lenders: result?.lenders || []
    }
  } catch (error) {
    console.error("Failed to fetch vehicles with financing:", error)
    return { vehicles: [], lenders: [] }
  }
}

// Helper: Calculate monthly payment (PMT formula)
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number = 60
): number {
  if (annualRate === 0) return principal / termMonths
  const monthlyRate = annualRate / 100 / 12
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
         (Math.pow(1 + monthlyRate, termMonths) - 1)
}

// Helper: Get effective price (special price if available, otherwise regular price)
export function getEffectivePrice(vehicle: Vehicle): number {
  return vehicle.specialPrice || vehicle.price || 0
}

// AI Settings for Anna chatbot and negotiator
const AI_SETTINGS_QUERY = `*[_type == "aiSettings"][0] {
  annaAssistant {
    displayName,
    welcomeMessage,
    quickActions[] { label, prompt }
  },
  priceNegotiator {
    negotiationRules {
      lowPriceThreshold,
      lowPriceMaxDiscount_0_31days,
      lowPriceMaxDiscount_32_46days,
      lowPriceMaxDiscount_47plus,
      highPriceMaxDiscount_0_46days,
      highPriceMaxDiscount_47plus
    }
  },
  fees {
    certification,
    financeDocFee,
    omvic,
    licensing
  },
  financing {
    lowestRate,
    numberOfLenders,
    terms,
    paymentFrequencies
  }
}`

export interface AISettings {
  annaAssistant?: {
    displayName: string
    welcomeMessage: string
    quickActions: { label: string; prompt: string }[]
  }
  priceNegotiator?: {
    negotiationRules: Record<string, number>
  }
  fees?: {
    certification: number
    financeDocFee: number
    omvic: number
    licensing: number
  }
  financing?: {
    lowestRate: number
    numberOfLenders: number
    terms?: number[]
    paymentFrequencies?: string[]
  }
}

export async function getAISettings(): Promise<AISettings> {
  try {
    return await sanityClient.fetch(AI_SETTINGS_QUERY, {}, {
      next: { tags: ["sanity-ai-settings"], revalidate: 3600 }
    })
  } catch (error) {
    console.error("Failed to fetch AI settings:", error)
    // Return defaults if CMS fetch fails
    return {
      annaAssistant: {
        displayName: "Anna",
        welcomeMessage: "Hi! I'm Anna from Planet Motors. How can I help you today?",
        quickActions: []
      },
      fees: {
        certification: 595,
        financeDocFee: 895,
        omvic: 22,
        licensing: 59
      },
      financing: {
        lowestRate: RATE_FLOOR,
        numberOfLenders: 20
      }
    }
  }
}

export { CACHE_TAGS }
