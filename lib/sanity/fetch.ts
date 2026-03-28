import { sanityClient } from "./client"
import {
  SITE_SETTINGS_QUERY,
  HOMEPAGE_QUERY,
  BLOG_LIST_QUERY,
  BLOG_COUNT_QUERY,
  BLOG_POST_QUERY,
  FAQ_QUERY,
  ACTIVE_PROMOS_QUERY,
  TESTIMONIALS_QUERY,
  PROTECTION_PLANS_QUERY,
} from "./queries"
import type {
  SiteSettings,
  HomepageData,
  BlogPost,
  FaqEntry,
  Promotion,
  Testimonial,
  ProtectionPlan,
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

export { CACHE_TAGS }
