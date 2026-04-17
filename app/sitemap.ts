import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicSiteUrl } from '@/lib/site-url'

// Force runtime generation — sitemap must read live data from Supabase,
// and the server client requires request context (cookies) which is
// unavailable during static build.  Without this, Next.js may attempt
// to pre-render the sitemap at build time and silently 404 in production.
export const dynamic = 'force-dynamic'

// ─── Single Sitemap ───────────────────────────────────────────────────────
// Generates /sitemap.xml with all URLs: static pages, vehicles, and blog.
// The sitemap protocol recommends max 50K URLs / 50 MB per file.
// At 10K vehicles + ~100 static + ~20 blog posts we're well under limits.
// If inventory exceeds 40K, re-introduce generateSitemaps() for splitting.

const VEHICLE_SITEMAP_LIMIT = 10_000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl()
  const currentDate = new Date().toISOString()

  const [pages, vehicles, blog] = await Promise.all([
    buildPagesSitemap(baseUrl, currentDate),
    buildVehiclesSitemap(baseUrl, currentDate),
    buildBlogSitemap(baseUrl, currentDate),
  ])

  return [...pages, ...vehicles, ...blog]
}

// ─── Builders ─────────────────────────────────────────────────────────────

function buildPagesSitemap(baseUrl: string, currentDate: string): MetadataRoute.Sitemap {
  // Core pages - highest priority
  const corePages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/inventory', priority: 0.95, changeFrequency: 'hourly' as const },
    { path: '/financing', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/trade-in', priority: 0.9, changeFrequency: 'weekly' as const },
  ]

  // Informational pages
  const infoPages = [
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/delivery', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/protection-plans', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/warranty', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/ev-battery-health', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/careers', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: '/clutch-guide-canada', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/electric-vehicles', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/tesla', priority: 0.9, changeFrequency: 'daily' as const },
  ]

  // Legal pages - lower priority
  const legalPages = [
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  // Location-based landing pages (for local SEO)
  const cities = [
    "toronto", "richmond-hill", "markham", "vaughan", "mississauga",
    "brampton", "scarborough", "north-york", "oakville", "hamilton",
    "ottawa", "montreal", "vancouver", "calgary", "edmonton",
    "kitchener", "london", "windsor", "barrie", "guelph"
  ]

  const locationPages = cities.map(city => ({
    path: `/used-cars/${city}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
  }))

  // Inventory filter pages (for search SEO)
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

  // High-converting model landing pages (SEO 2026 standard)
  const modelLandingPages = [
    { path: '/cars/toyota/rav4', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/camry', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/highlander', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/corolla', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/honda/civic', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/honda/cr-v', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/honda/accord', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/honda/pilot', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-y', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-3', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-x', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-s', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/ford/f-150', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/ford/explorer', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/ford/escape', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/ford/mustang-mach-e', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/hyundai/ioniq-5', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/hyundai/ioniq-6', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/hyundai/tucson', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/cars/bmw/x5', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/bmw/ix', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/cars/mercedes-benz/glc', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/audi/q5', priority: 0.9, changeFrequency: 'daily' as const },
  ]

  const staticRoutes = [
    ...corePages,
    ...infoPages,
    ...legalPages,
    ...locationPages,
    ...modelLandingPages,
  ].map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const filterRoutes = inventoryFilters.map(filter => ({
    url: `${baseUrl}${filter.path}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: filter.priority,
  }))

  return [...staticRoutes, ...filterRoutes]
}

async function buildVehiclesSitemap(baseUrl: string, currentDate: string): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient()
    const { data: inventoryVehicles, error } = await supabase
      .from('vehicles')
      .select('id, updated_at')
      .eq('status', 'available')
      .order('updated_at', { ascending: false })
      .limit(VEHICLE_SITEMAP_LIMIT)

    if (error) {
      console.error('Supabase error in buildVehiclesSitemap:', error)
      const wrapped = new Error(`Failed to fetch vehicles for sitemap: ${error.message}`)
      // Preserve the PostgreSQL error code (e.g. '42P01' for undefined_table)
      // so the catch block can distinguish permanent from transient failures.
      ;(wrapped as Error & { code?: string }).code = error.code
      throw wrapped
    }

    return (inventoryVehicles || []).map((vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.id}`,
      lastModified: vehicle.updated_at || currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }))
  } catch (err) {
    console.error('Error building vehicles sitemap:', err)

    // Distinguish transient vs permanent errors to protect SEO:
    // - Transient (network timeout, 5xx): re-throw so Next.js returns 500,
    //   which crawlers handle by retrying later (preserving indexed URLs).
    // - Permanent (table missing, schema error): return empty so the sitemap
    //   index still generates with static pages during initial setup.
    const code = (err as { code?: string })?.code
    const isPermanent = code === '42P01'

    if (isPermanent) {
      return []
    }

    throw err
  }
}

function buildBlogSitemap(baseUrl: string, currentDate: string): MetadataRoute.Sitemap {
  // In production, fetch from Sanity CMS
  const blogSlugs = [
    'ev-buying-guide-2026',
    'tesla-model-3-vs-model-y-comparison',
    'financing-tips-first-time-buyers',
    'trade-in-maximize-value',
    'electric-vehicle-incentives-canada-2026',
    'best-used-cars-under-30000',
    'ev-battery-health-explained',
    'certified-pre-owned-vs-used',
    'bad-credit-car-loan-guide',
    'car-delivery-what-to-expect',
    'clutch-replacement-cost-canada',
    'clutch-problems-signs-symptoms',
    'best-manual-transmission-cars-canada-2026',
    'how-to-drive-manual-transmission',
    'clutch-vs-automatic-which-is-better',
    'clutch-maintenance-tips-canadian-winters',
  ]

  return blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
}