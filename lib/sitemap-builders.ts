import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'
import { buildPublicStatusFilter } from '@/lib/vehicles/status-filter'

export interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: string
  priority: number
}

const VEHICLE_SITEMAP_LIMIT = 10_000

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

  const staticRoutes = [
    ...corePages, ...infoPages, ...legalPages, ...locationPages, ...modelLandingPages,
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

export async function buildVehiclesSitemap(baseUrl: string, currentDate: string): Promise<SitemapEntry[]> {
  try {
    const supabase = createSitemapClient()
    if (!supabase) {
      console.warn('Sitemap: Supabase not configured, skipping vehicles')
      return []
    }
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, updated_at')
      .or(buildPublicStatusFilter())
      .order('updated_at', { ascending: false })
      .limit(VEHICLE_SITEMAP_LIMIT)

    if (error) {
      console.error('Supabase error in buildVehiclesSitemap:', error)
      const wrapped = new Error(`Failed to fetch vehicles: ${error.message}`)
      ;(wrapped as Error & { code?: string }).code = error.code
      throw wrapped
    }

    return (data || []).map((v) => ({
      url: `${baseUrl}/vehicles/${v.id}`,
      lastModified: v.updated_at || currentDate,
      changeFrequency: 'daily',
      priority: 0.75,
    }))
  } catch (err) {
    console.error('Error building vehicles sitemap:', err)
    if ((err as { code?: string })?.code === '42P01') return []
    throw err
  }
}

export function buildBlogSitemap(baseUrl: string, currentDate: string): SitemapEntry[] {
  // Dynamically import all blog post keys from the source of truth
  // This ensures the sitemap always stays in sync with actual content
  const { blogPosts } = require('@/lib/blog-data')
  const slugs = Object.keys(blogPosts)

  return slugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))
}