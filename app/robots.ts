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

/**
 * AI search & recommendation agents — explicitly ALLOWED.
 *
 * These crawlers populate live answers in ChatGPT Search, Perplexity,
 * Claude, and similar tools. Allowing them turns Planet Motors into
 * a citable source when a user asks an AI "where do I buy a clean
 * used EV in Ontario?" — they cannot recommend us if they cannot
 * read us.
 *
 * Distinct from AI_TRAINING_CRAWLERS below: these are the agents
 * that fetch on-demand at user query time, NOT the bulk scrapers
 * that vacuum content for model training.
 */
const AI_RECOMMENDATION_CRAWLERS = [
  'OAI-SearchBot',   // OpenAI Search (powers ChatGPT Search results)
  'ChatGPT-User',    // Fetched when a user clicks a link inside ChatGPT
  'PerplexityBot',   // Perplexity Search
  'ClaudeBot',       // Anthropic's search/citation crawler
]

/**
 * AI training crawlers — BLOCKED to protect content from being
 * absorbed into model training corpora without compensation.
 */
const AI_TRAINING_CRAWLERS = [
  'GPTBot',            // OpenAI training crawler
  'Google-Extended',   // Google's training-data crawler (separate from Googlebot)
  'CCBot',             // Common Crawl (heavily used as training feedstock)
  'anthropic-ai',      // Older Anthropic training identifier
  'Claude-Web',        // Older Anthropic identifier
  'Bytespider',        // ByteDance / TikTok crawler
  'Applebot-Extended', // Apple's training opt-out identifier
  'cohere-ai',         // Cohere training crawler
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
      // Block AI training crawlers (no allow-list of paths — full disallow)
      ...AI_TRAINING_CRAWLERS.map(userAgent => ({ userAgent, disallow: '/' })),
      // Allow AI search & recommendation agents — they cite us only
      // if they can read us. Standard disallows still apply so agents
      // do not waste request budget on /admin, /api, /checkout, etc.
      ...AI_RECOMMENDATION_CRAWLERS.map(userAgent => ({
        userAgent,
        allow: '/',
        disallow: SEARCH_ENGINE_DISALLOW,
      })),
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
