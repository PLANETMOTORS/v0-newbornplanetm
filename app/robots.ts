import { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site-url'

/** Paths blocked for all standard crawlers */
const STANDARD_DISALLOW = [
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
]

/** Paths blocked for search-engine crawlers (subset of STANDARD_DISALLOW) */
const SEARCH_ENGINE_DISALLOW = ['/api/', '/account/', '/checkout/', '/admin/']

/** AI training crawlers — block all by default to protect content */
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
  'Bytespider',
  'PerplexityBot',
  'Applebot-Extended',
  'cohere-ai',
]

/** Aggressive SEO crawlers — block all */
const SEO_CRAWLERS = ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot']

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: STANDARD_DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: SEARCH_ENGINE_DISALLOW,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/images/', '/vehicles/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: SEARCH_ENGINE_DISALLOW,
      },
      // Block aggressive SEO crawlers
      ...SEO_CRAWLERS.map(userAgent => ({ userAgent, disallow: '/' })),
      // Block AI training crawlers
      ...AI_CRAWLERS.map(userAgent => ({ userAgent, disallow: '/' })),
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
    ],
    // Next.js generates /sitemap.xml from app/sitemap.ts (single combined sitemap)
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
