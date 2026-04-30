/**
 * Lightweight smoke tests for the `/cars/[slug]` page route.
 *
 * We don't render the React tree (Next.js page-routing harness adds
 * fixture overhead unrelated to the SEO contract). Instead we exercise
 * `generateMetadata` with the same async params shape Next.js passes
 * at runtime, and verify it produces SEO-correct output for valid
 * slugs and a fallback for invalid ones.
 *
 * The static-params enumeration is also asserted to make sure every
 * slug shipped in the sitemap will pre-render to a real page.
 */

import { describe, it, expect } from 'vitest'
import { parseCategorySlug } from '@/lib/seo/category-slug-parser'

// Import the page module — top-level imports must work for the page
// to ship at all, so just loading it is itself a smoke test.
import * as page from '@/app/cars/[make]/page'

describe('app/cars/[make] page module', () => {
  it('exports a default page component', () => {
    expect(typeof page.default).toBe('function')
  })

  it('exports generateMetadata + generateStaticParams', () => {
    expect(typeof page.generateMetadata).toBe('function')
    expect(typeof page.generateStaticParams).toBe('function')
  })

  describe('generateMetadata', () => {
    it('produces SEO metadata for a valid category slug', async () => {
      const meta = await page.generateMetadata({
        params: Promise.resolve({ make: 'electric-in-toronto' }),
      })
      expect(meta.title).toContain('Toronto')
      expect(meta.title).toContain('Electric')
      expect(meta.description).toBeTruthy()
      expect((meta.alternates as { canonical?: string } | undefined)?.canonical).toBe(
        '/cars/electric-in-toronto',
      )
    })

    it('produces canonical path for tesla make slug', async () => {
      const meta = await page.generateMetadata({
        params: Promise.resolve({ make: 'tesla' }),
      })
      expect((meta.alternates as { canonical?: string } | undefined)?.canonical).toBe(
        '/cars/tesla',
      )
    })

    it('falls back to a 404 title for unknown slugs', async () => {
      const meta = await page.generateMetadata({
        params: Promise.resolve({ make: 'unicorn-motors' }),
      })
      expect(meta.title).toMatch(/not found/i)
    })
  })

  describe('generateStaticParams', () => {
    it('returns a non-empty array of slug params', () => {
      const params = page.generateStaticParams()
      expect(Array.isArray(params)).toBe(true)
      expect(params.length).toBeGreaterThan(50)
      expect(params[0]).toHaveProperty('make')
    })

    it('every emitted static param parses back to a valid filter', () => {
      const params = page.generateStaticParams()
      for (const { make } of params) {
        expect(parseCategorySlug(make), `slug "${make}" failed to parse`).not.toBeNull()
      }
    })

    it('includes the high-value bare and combo slugs', () => {
      const params = page.generateStaticParams()
      const slugs = new Set(params.map(p => p.make))
      expect(slugs.has('electric')).toBe(true)
      expect(slugs.has('tesla')).toBe(true)
      expect(slugs.has('luxury-evs')).toBe(true)
      expect(slugs.has('electric-in-toronto')).toBe(true)
      expect(slugs.has('tesla-in-richmond-hill')).toBe(true)
    })
  })
})
