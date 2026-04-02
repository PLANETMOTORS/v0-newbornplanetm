// Planet Motors - Sanity data fetching (uses @sanity/client)
import { sanityClient } from "./client"
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
