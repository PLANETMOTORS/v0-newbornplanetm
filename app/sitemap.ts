import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://planetmotors.ca'
  
  // Static pages
  const staticPages = [
    '',
    '/vehicles',
    '/about',
    '/contact',
    '/financing',
    '/sell',
    '/trade-in',
    '/schedule',
    '/compare',
    '/delivery',
    '/faq',
    '/warranty',
    '/ev-battery',
    '/accessibility',
    '/privacy',
    '/terms',
  ]

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/vehicles' ? 0.9 : 0.8,
  }))

  // Sample vehicle detail pages - in production, fetch from database
  const vehicleIds = ['1', '2', '3', '4', '5']
  const vehicleRoutes = vehicleIds.map((id) => ({
    url: `${baseUrl}/vehicles/${id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...vehicleRoutes]
}
