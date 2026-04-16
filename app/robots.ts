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
      // Block aggressive SEO crawlers
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
      // AI training crawlers — block by default to protect content
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        disallow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        disallow: '/',
      },
      {
        userAgent: 'cohere-ai',
        disallow: '/',
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
    ],
    // Next.js generates a sitemap index at /sitemap.xml with child sitemaps
    // at /sitemap/0.xml (pages), /sitemap/1.xml (vehicles), /sitemap/2.xml (blog)
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
