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

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await sanityClient.fetch(SITE_SETTINGS_QUERY)
  } catch {
    return null
  }
}

export async function getNavigation(): Promise<Navigation | null> {
  try {
    return await sanityClient.fetch(NAVIGATION_QUERY)
  } catch {
    return null
  }
}

export async function getHomepageData(): Promise<HomepageData | null> {
  try {
    return await sanityClient.fetch(HOMEPAGE_QUERY)
  } catch {
    return null
  }
}

export async function getSellYourCarPage(): Promise<SellYourCarPage | null> {
  try {
    return await sanityClient.fetch(SELL_YOUR_CAR_PAGE_QUERY)
  } catch {
    return null
  }
}

export async function getFinancingPage(): Promise<FinancingPage | null> {
  try {
    return await sanityClient.fetch(FINANCING_PAGE_QUERY)
  } catch {
    return null
  }
}

export async function getInventorySettings(): Promise<InventorySettings | null> {
  try {
    return await sanityClient.fetch(INVENTORY_SETTINGS_QUERY)
  } catch {
    return null
  }
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(VEHICLES_QUERY) || []
  } catch {
    return []
  }
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  try {
    return await sanityClient.fetch(VEHICLE_BY_SLUG_QUERY, { slug })
  } catch {
    return null
  }
}

export async function getFeaturedVehicles(): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(FEATURED_VEHICLES_QUERY) || []
  } catch {
    return []
  }
}

export async function getVehiclesByStockNumbers(stockNumbers: string[]): Promise<Vehicle[]> {
  try {
    return await sanityClient.fetch(VEHICLES_BY_STOCK_NUMBERS_QUERY, { stockNumbers }) || []
  } catch {
    return []
  }
}

export async function getBlogPosts(page = 1, perPage = 12): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const start = (page - 1) * perPage
    const end = start + perPage
    const [posts, total] = await Promise.all([
      sanityClient.fetch(BLOG_LIST_QUERY, { start, end }),
      sanityClient.fetch(BLOG_COUNT_QUERY),
    ])
    return { posts: posts || [], total: total || 0 }
  } catch {
    return { posts: [], total: 0 }
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await sanityClient.fetch(BLOG_POST_QUERY, { slug })
  } catch {
    return null
  }
}

export async function getFaqs(): Promise<FaqEntry[]> {
  try {
    return await sanityClient.fetch(FAQ_QUERY) || []
  } catch {
    return []
  }
}

export async function getActivePromos(): Promise<Promotion[]> {
  try {
    return await sanityClient.fetch(ACTIVE_PROMOS_QUERY) || []
  } catch {
    return []
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await sanityClient.fetch(TESTIMONIALS_QUERY) || []
  } catch {
    return []
  }
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  try {
    return await sanityClient.fetch(FEATURED_TESTIMONIALS_QUERY) || []
  } catch {
    return []
  }
}

export async function getProtectionPlans(): Promise<ProtectionPlan[]> {
  try {
    return await sanityClient.fetch(PROTECTION_PLANS_QUERY) || []
  } catch {
    return []
  }
}

export async function getLenders(): Promise<Lender[]> {
  try {
    return await sanityClient.fetch(LENDERS_QUERY) || []
  } catch {
    return []
  }
}
