import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'
import { buildPublicStatusFilter } from '@/lib/vehicles/status-filter'
import { blogPosts } from '@/lib/blog-data'
import { enumerateCategorySlugs } from '@/lib/seo/category-slug-parser'

export interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: string
  priority: number
  /**
   * Absolute URLs of associated images. When present, the sitemap entry
   * is emitted with `<image:image>` tags, which is what feeds Google
   * Images for vehicle photos. Other surfaces (Bing, Yandex) ignore
   * unknown fields, so this is purely additive.
   */
  images?: string[]
}

const VEHICLE_SITEMAP_LIMIT = 10_000

/**
 * Maximum images attached per vehicle entry. Google supports up to 1,000
 * per URL but in practice 4-6 is plenty for a car listing and keeps the
 * sitemap file small at 5K+ vehicle scale. Picks `primary_image_url`
 * first, then up to (MAX - 1) extra photos from `image_urls`.
 */
const MAX_IMAGES_PER_VEHICLE = 5

function createSitemapClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return null
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function buildPagesSitemap(baseUrl: string, currentDate: string): SitemapEntry[] {
  const corePages = [
    { path: '', priority: 1, changeFrequency: 'daily' },
    { path: '/inventory', priority: 0.95, changeFrequency: 'hourly' },
    { path: '/financing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/trade-in', priority: 0.9, changeFrequency: 'weekly' },
  ]

  const infoPages = [
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/delivery', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/protection-plans', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/warranty', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/aviloo', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/careers', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/clutch-guide-canada', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/electric-vehicles', priority: 0.95, changeFrequency: 'daily' },
    { path: '/tesla', priority: 0.9, changeFrequency: 'daily' },
  ]

  const legalPages = [
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const cities = [
    "toronto", "richmond-hill", "markham", "vaughan", "mississauga",
    "brampton", "scarborough", "north-york", "oakville", "hamilton",
    "ottawa", "montreal", "vancouver", "calgary", "edmonton",
    "kitchener", "london", "windsor", "barrie", "guelph"
  ]

  const locationPages = cities.map(city => ({
    path: `/used-cars/${city}`, priority: 0.85, changeFrequency: 'weekly',
  }))

  const inventoryFilters = [
    { path: '/inventory?fuelType=Electric', priority: 0.9 },
    { path: '/inventory?fuelType=Hybrid', priority: 0.85 },
    { path: '/inventory?fuelType=PHEV', priority: 0.85 },
    { path: '/inventory?fuelType=Gasoline', priority: 0.8 },
    { path: '/inventory?bodyType=SUV', priority: 0.9 },
    { path: '/inventory?bodyType=Sedan', priority: 0.85 },
    { path: '/inventory?bodyType=Truck', priority: 0.85 },
    { path: '/inventory?bodyType=Coupe', priority: 0.8 },
    { path: '/inventory?bodyType=Hatchback', priority: 0.8 },
    { path: '/inventory?make=Tesla', priority: 0.9 },
    { path: '/inventory?make=BMW', priority: 0.85 },
    { path: '/inventory?make=Mercedes-Benz', priority: 0.85 },
    { path: '/inventory?make=Porsche', priority: 0.85 },
    { path: '/inventory?make=Audi', priority: 0.85 },
    { path: '/inventory?make=Toyota', priority: 0.85 },
    { path: '/inventory?make=Honda', priority: 0.85 },
    { path: '/inventory?make=Ford', priority: 0.85 },
    { path: '/inventory?make=Lexus', priority: 0.8 },
    { path: '/inventory?make=Hyundai', priority: 0.8 },
    { path: '/inventory?make=Kia', priority: 0.8 },
    { path: '/inventory?make=Mazda', priority: 0.8 },
    { path: '/inventory?make=Volkswagen', priority: 0.8 },
    { path: '/inventory?make=Chevrolet', priority: 0.8 },
    { path: '/inventory?make=Nissan', priority: 0.8 },
    { path: '/inventory?make=Tesla&fuelType=Electric', priority: 0.9 },
    { path: '/inventory?bodyType=SUV&fuelType=Electric', priority: 0.9 },
    { path: '/inventory?make=BMW&bodyType=SUV', priority: 0.85 },
    { path: '/inventory?make=Mercedes-Benz&bodyType=SUV', priority: 0.85 },
    { path: '/inventory?maxPrice=30000', priority: 0.8 },
    { path: '/inventory?maxPrice=50000', priority: 0.8 },
    { path: '/inventory?minPrice=50000', priority: 0.75 },
    { path: '/inventory?transmission=Manual', priority: 0.9 },
    { path: '/inventory?transmission=Automatic', priority: 0.8 },
  ]


  const modelLandingPages = [
    { path: '/cars/toyota/rav4', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/toyota/camry', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/toyota/highlander', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/toyota/corolla', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/honda/civic', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/honda/cr-v', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/honda/accord', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/honda/pilot', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/tesla/model-y', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/tesla/model-3', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/tesla/model-x', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/tesla/model-s', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/ford/f-150', priority: 0.95, changeFrequency: 'daily' },
    { path: '/cars/ford/explorer', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/ford/escape', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/ford/mustang-mach-e', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/hyundai/ioniq-5', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/hyundai/ioniq-6', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/hyundai/tucson', priority: 0.85, changeFrequency: 'daily' },
    { path: '/cars/bmw/x5', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/bmw/ix', priority: 0.85, changeFrequency: 'daily' },
    { path: '/cars/mercedes-benz/glc', priority: 0.9, changeFrequency: 'daily' },
    { path: '/cars/audi/q5', priority: 0.9, changeFrequency: 'daily' },
  ]

  // Category landing pages — single source of truth lives in the slug
  // parser so sitemap URLs always resolve to a real, parseable page.
  const categoryPages = enumerateCategorySlugs().map(slug => ({
    path: `/cars/${slug}`,
    priority: slug.includes('-in-') ? 0.85 : 0.9,
    changeFrequency: 'hourly',
  }))

  const staticRoutes = [
    ...corePages, ...infoPages, ...legalPages, ...locationPages, ...modelLandingPages, ...categoryPages,
  ].map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const filterRoutes = inventoryFilters.map(filter => ({
    url: `${baseUrl}${filter.path}`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: filter.priority,
  }))

  return [...staticRoutes, ...filterRoutes]
}

interface VehicleSitemapRow {
  id: string
  updated_at: string | null
  primary_image_url?: string | null
  image_urls?: string[] | null
}

/**
 * Build the list of image URLs to attach to a vehicle's sitemap entry.
 *
 * - Prepends `primary_image_url` when present (so Google sees it first).
 * - Adds up to `MAX_IMAGES_PER_VEHICLE - 1` extra photos from `image_urls`.
 * - De-duplicates and drops empty / non-string values defensively because
 *   the column historically allowed nulls.
 */
export function buildVehicleImages(row: VehicleSitemapRow): string[] {
  const out: string[] = []
  if (row.primary_image_url && typeof row.primary_image_url === 'string') {
    out.push(row.primary_image_url)
  }
  if (Array.isArray(row.image_urls)) {
    for (const url of row.image_urls) {
      if (typeof url !== 'string' || !url) continue
      if (out.includes(url)) continue
      out.push(url)
      if (out.length >= MAX_IMAGES_PER_VEHICLE) break
    }
  }
  return out
}

export async function buildVehiclesSitemap(baseUrl: string, currentDate: string): Promise<SitemapEntry[]> {
  try {
    const supabase = createSitemapClient()
    if (!supabase) {
      console.warn('Sitemap: Supabase not configured, skipping vehicles')
      return []
    }
    let { data, error } = await supabase
      .from('vehicles')
      .select('id, updated_at, primary_image_url, image_urls')
      .or(buildPublicStatusFilter())
      .order('updated_at', { ascending: false })
      .limit(VEHICLE_SITEMAP_LIMIT)

    if (error?.code === '42703') {
      // sold_at column not yet migrated — fall back to simple status filter
      const fallback = await supabase
        .from('vehicles')
        .select('id, updated_at, primary_image_url, image_urls')
        .in('status', ['available', 'reserved', 'sold'])
        .order('updated_at', { ascending: false })
        .limit(VEHICLE_SITEMAP_LIMIT)
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Supabase error in buildVehiclesSitemap:', error)
      const wrapped = new Error(`Failed to fetch vehicles: ${error.message}`)
      ;(wrapped as Error & { code?: string }).code = error.code
      throw wrapped
    }

    return (data || []).map((v: VehicleSitemapRow) => {
      const images = buildVehicleImages(v)
      return {
        url: `${baseUrl}/vehicles/${v.id}`,
        lastModified: v.updated_at || currentDate,
        changeFrequency: 'daily',
        priority: 0.75,
        ...(images.length > 0 ? { images } : {}),
      }
    })
  } catch (err) {
    console.error('Error building vehicles sitemap:', err)
    if ((err as { code?: string })?.code === '42P01') return []
    throw err
  }
}

export function buildBlogSitemap(baseUrl: string, currentDate: string): SitemapEntry[] {
  // Static ESM import keeps the sitemap in lockstep with the blog source
  // of truth (`lib/blog-data`) without the cost of a dynamic `require()`
  // on every request.
  const slugs = Object.keys(blogPosts)

  return slugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))
}