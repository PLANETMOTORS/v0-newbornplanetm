import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl()
  const currentDate = new Date().toISOString()
  
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
    // Manual transmission content
    { path: '/clutch-guide-canada', priority: 0.9, changeFrequency: 'weekly' as const },
    // EV-focused pages
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
    // Fuel types
    { path: '/inventory?fuelType=Electric', priority: 0.9 },
    { path: '/inventory?fuelType=Hybrid', priority: 0.85 },
    { path: '/inventory?fuelType=PHEV', priority: 0.85 },
    { path: '/inventory?fuelType=Gasoline', priority: 0.8 },
    // Body types
    { path: '/inventory?bodyType=SUV', priority: 0.9 },
    { path: '/inventory?bodyType=Sedan', priority: 0.85 },
    { path: '/inventory?bodyType=Truck', priority: 0.85 },
    { path: '/inventory?bodyType=Coupe', priority: 0.8 },
    { path: '/inventory?bodyType=Hatchback', priority: 0.8 },
    // Popular makes
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
    // Combined filters (high-value searches)
    { path: '/inventory?make=Tesla&fuelType=Electric', priority: 0.9 },
    { path: '/inventory?bodyType=SUV&fuelType=Electric', priority: 0.9 },
    { path: '/inventory?make=BMW&bodyType=SUV', priority: 0.85 },
    { path: '/inventory?make=Mercedes-Benz&bodyType=SUV', priority: 0.85 },
    // Price ranges
    { path: '/inventory?maxPrice=30000', priority: 0.8 },
    { path: '/inventory?maxPrice=50000', priority: 0.8 },
    { path: '/inventory?minPrice=50000', priority: 0.75 },
    // Transmission types
    { path: '/inventory?transmission=Manual', priority: 0.9 },
    { path: '/inventory?transmission=Automatic', priority: 0.8 },
  ]

  // High-converting model landing pages (SEO 2026 standard)
  const modelLandingPages = [
    // Toyota - Focus on Hybrid & Reliability
    { path: '/cars/toyota/rav4', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/camry', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/highlander', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/toyota/corolla', priority: 0.9, changeFrequency: 'daily' as const },
    // Honda - Canadian Made
    { path: '/cars/honda/civic', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/honda/cr-v', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/honda/accord', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/honda/pilot', priority: 0.9, changeFrequency: 'daily' as const },
    // Tesla - EV Focus
    { path: '/cars/tesla/model-y', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-3', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-x', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/tesla/model-s', priority: 0.9, changeFrequency: 'daily' as const },
    // Ford - Trucks & Capability
    { path: '/cars/ford/f-150', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/cars/ford/explorer', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/ford/escape', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/ford/mustang-mach-e', priority: 0.9, changeFrequency: 'daily' as const },
    // Hyundai - EV Competition
    { path: '/cars/hyundai/ioniq-5', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/hyundai/ioniq-6', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/hyundai/tucson', priority: 0.85, changeFrequency: 'daily' as const },
    // Luxury - BMW, Mercedes, Audi
    { path: '/cars/bmw/x5', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/bmw/ix', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/cars/mercedes-benz/glc', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/audi/q5', priority: 0.9, changeFrequency: 'daily' as const },
  ]

  // Combine all static routes
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

  // Add inventory filter routes
  const filterRoutes = inventoryFilters.map(filter => ({
    url: `${baseUrl}${filter.path}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: filter.priority,
  }))

  let vehicleRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: inventoryVehicles } = await supabase
      .from('vehicles')
      .select('id, updated_at')
      .eq('status', 'available')
      .order('updated_at', { ascending: false })
      .limit(10000)

    vehicleRoutes = (inventoryVehicles || []).map((vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.id}`,
      lastModified: vehicle.updated_at || currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }))
  } catch {
    vehicleRoutes = []
  }

  // Blog post routes
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
    // Manual transmission guides
    'clutch-replacement-cost-canada',
    'clutch-problems-signs-symptoms',
    'best-manual-transmission-cars-canada-2026',
    'how-to-drive-manual-transmission',
    'clutch-vs-automatic-which-is-better',
    'clutch-maintenance-tips-canadian-winters',
  ]

  const blogRoutes = blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...filterRoutes,
    ...vehicleRoutes,
    ...blogRoutes,
  ]
}
