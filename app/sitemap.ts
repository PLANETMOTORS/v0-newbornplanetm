import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://planetmotors.ca'
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
  ]

  // Legal pages - lower priority
  const legalPages = [
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  // Inventory filter pages (helps with SEO for specific searches)
  const inventoryFilters = [
    { path: '/inventory?fuelType=Electric', priority: 0.85 },
    { path: '/inventory?bodyType=SUV', priority: 0.85 },
    { path: '/inventory?bodyType=Sedan', priority: 0.85 },
    { path: '/inventory?bodyType=Truck', priority: 0.85 },
    { path: '/inventory?make=Tesla', priority: 0.8 },
    { path: '/inventory?make=BMW', priority: 0.8 },
    { path: '/inventory?make=Mercedes-Benz', priority: 0.8 },
    { path: '/inventory?make=Porsche', priority: 0.8 },
    { path: '/inventory?make=Audi', priority: 0.8 },
    { path: '/inventory?make=Toyota', priority: 0.8 },
    { path: '/inventory?make=Honda', priority: 0.8 },
    { path: '/inventory?make=Ford', priority: 0.8 },
  ]

  // Combine all static routes
  const staticRoutes = [
    ...corePages,
    ...infoPages,
    ...legalPages,
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

  // Vehicle detail pages
  // In production, fetch actual vehicle IDs from database
  const vehicleIds = [
    '2024-tesla-model-y',
    '2024-tesla-model-3',
    '2024-bmw-m4',
    '2024-porsche-taycan',
    '2023-mercedes-eqs',
    '2024-honda-crv',
    '2024-toyota-rav4',
    '2023-audi-etron-gt',
    '2024-ford-f150',
  ]
  
  const vehicleRoutes = vehicleIds.map(id => ({
    url: `${baseUrl}/vehicles/${id}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }))

  // Blog post routes
  // In production, fetch from Sanity CMS
  const blogSlugs = [
    'ev-buying-guide-2024',
    'tesla-model-3-vs-model-y',
    'financing-tips-first-time-buyers',
    'trade-in-maximize-value',
    'electric-vehicle-incentives-canada',
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
