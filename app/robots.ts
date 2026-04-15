import { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/checkout/',
          '/favorites/',
          '/admin/',
          '/_next/',
          '/auth/callback',
          '/auth/error',
          '/auth/verify-email',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/checkout/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/images/', '/vehicles/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/checkout/',
          '/admin/',
        ],
      },
      // Block aggressive crawlers
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
    // Next.js generates a sitemap index at /sitemap.xml with child sitemaps
    // at /sitemap/0.xml (pages), /sitemap/1.xml (vehicles), /sitemap/2.xml (blog)
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
