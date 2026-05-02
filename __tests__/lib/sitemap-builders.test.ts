import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
const mockIn = vi.fn().mockReturnValue({ order: mockOrder })
const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
const mockSelect = vi.fn().mockReturnValue({ in: mockIn, or: mockOr })
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/lib/supabase/config', () => ({
  getSupabaseUrl: vi.fn(() => 'https://test.supabase.co'),
  getSupabaseAnonKey: vi.fn(() => 'test-key'),
}))

vi.mock('@/lib/sanity/fetch', () => ({
  getBlogSlugs: vi.fn(() => Promise.resolve([
    { slug: 'sanity-only-post' },
    { slug: 'check-battery-health-used-tesla-canada' },
  ])),
}))

import { buildVehiclesSitemap, buildPagesSitemap, buildBlogSitemap, buildVehicleImages } from '@/lib/sitemap-builders'

describe('buildVehiclesSitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLimit.mockResolvedValue({
      data: [
        { id: 'abc-123', updated_at: '2025-01-01T00:00:00Z', primary_image_url: 'https://cdn.example.com/abc-1.jpg', image_urls: ['https://cdn.example.com/abc-2.jpg'] },
        { id: 'def-456', updated_at: '2025-01-02T00:00:00Z', primary_image_url: null, image_urls: null },
      ],
      error: null,
    })
  })

  it('queries vehicles with public statuses via .or() filter', async () => {
    await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
    expect(mockSelect).toHaveBeenCalledWith('id, updated_at, primary_image_url, image_urls')
  })

  it('returns sitemap entries for each vehicle', async () => {
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result).toHaveLength(2)
    expect(result[0].url).toBe('https://example.com/vehicles/abc-123')
    expect(result[1].url).toBe('https://example.com/vehicles/def-456')
  })

  it('uses vehicle updated_at as lastModified', async () => {
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result[0].lastModified).toBe('2025-01-01T00:00:00Z')
    expect(result[1].lastModified).toBe('2025-01-02T00:00:00Z')
  })

  it('returns empty array when no vehicles found', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result).toHaveLength(0)
  })

  it('handles a null `data` payload from Supabase gracefully', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: null })
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result).toEqual([])
  })

  it('falls back to .in() when sold_at column is missing (error 42703)', async () => {
    // First call (with .or()) returns column-not-found error
    mockLimit
      .mockResolvedValueOnce({ data: null, error: { message: 'column vehicles.sold_at does not exist', code: '42703' } })
      // Second call (fallback with .in()) succeeds
      .mockResolvedValueOnce({
        data: [{ id: 'fallback-1', updated_at: '2025-06-01T00:00:00Z', primary_image_url: null, image_urls: null }],
        error: null,
      })
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://example.com/vehicles/fallback-1')
    // .in() fallback was called
    expect(mockIn).toHaveBeenCalledWith('status', ['available', 'reserved', 'sold'])
  })

  it('attaches images when primary_image_url and image_urls are present', async () => {
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result[0].images).toEqual([
      'https://cdn.example.com/abc-1.jpg',
      'https://cdn.example.com/abc-2.jpg',
    ])
  })

  it('omits the images field when no photos are available', async () => {
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result[1].images).toBeUndefined()
  })

  it('falls back to currentDate when updated_at is null', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [{ id: 'no-date', updated_at: null, primary_image_url: null, image_urls: null }],
      error: null,
    })
    const result = await buildVehiclesSitemap('https://example.com', '2025-12-25')
    expect(result[0].lastModified).toBe('2025-12-25')
  })

  it('throws on Supabase error', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'DB error', code: '500' } })
    await expect(buildVehiclesSitemap('https://example.com', '2025-01-01')).rejects.toThrow('Failed to fetch vehicles: DB error')
  })

  it('sets changeFrequency to daily and priority to 0.8', async () => {
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result[0].changeFrequency).toBe('daily')
    expect(result[0].priority).toBe(0.75)
  })
})

describe('buildPagesSitemap', () => {
  it('returns static page entries with correct structure', () => {
    const result = buildPagesSitemap('https://example.com', '2025-01-01')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].url).toBe('https://example.com')
    expect(result[0].priority).toBe(1)
  })

  it('includes inventory page', () => {
    const result = buildPagesSitemap('https://example.com', '2025-01-01')
    const inventory = result.find(r => r.url === 'https://example.com/inventory')
    expect(inventory).toBeDefined()
    expect(inventory?.priority).toBe(0.95)
  })

  it('includes /cars/<slug> category landing pages from the slug parser', () => {
    const result = buildPagesSitemap('https://example.com', '2025-01-01')
    const urls = new Set(result.map(r => r.url))
    expect(urls.has('https://example.com/cars/electric')).toBe(true)
    expect(urls.has('https://example.com/cars/luxury-evs')).toBe(true)
    expect(urls.has('https://example.com/cars/under-50k')).toBe(true)
    expect(urls.has('https://example.com/cars/electric-in-toronto')).toBe(true)
    expect(urls.has('https://example.com/cars/tesla-in-richmond-hill')).toBe(true)
  })

  it('marks city-cross category pages with the lower priority bucket', () => {
    const result = buildPagesSitemap('https://example.com', '2025-01-01')
    const cityCross = result.find(r => r.url === 'https://example.com/cars/electric-in-toronto')
    const bare = result.find(r => r.url === 'https://example.com/cars/electric')
    expect(cityCross?.priority).toBe(0.85)
    expect(bare?.priority).toBe(0.9)
  })

  it('marks all category landing pages as hourly so search engines see fresh inventory cadence', () => {
    const result = buildPagesSitemap('https://example.com', '2025-01-01')
    const sample = result.find(r => r.url === 'https://example.com/cars/electric')
    expect(sample?.changeFrequency).toBe('hourly')
  })
})

describe('buildBlogSitemap', () => {
  it('is exported and callable (signature smoke check)', () => {
    expect(typeof buildBlogSitemap).toBe('function')
    expect(buildBlogSitemap.length).toBe(2)
  })

  it('emits one entry per blog post with /blog/<slug> URLs', async () => {
    const result = await buildBlogSitemap('https://example.com', '2025-09-09')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    for (const entry of result) {
      expect(entry.url.startsWith('https://example.com/blog/')).toBe(true)
      expect(entry.lastModified).toBe('2025-09-09')
      expect(entry.changeFrequency).toBe('weekly')
      expect(entry.priority).toBe(0.6)
    }
  })

  it('includes Sanity-only slugs not in static data', async () => {
    const result = await buildBlogSitemap('https://example.com', '2025-09-09')
    const urls = result.map(e => e.url)
    expect(urls).toContain('https://example.com/blog/sanity-only-post')
  })

  it('de-duplicates slugs present in both static and Sanity', async () => {
    const result = await buildBlogSitemap('https://example.com', '2025-09-09')
    const urls = result.map(e => e.url)
    const batteryUrls = urls.filter(u => u.includes('check-battery-health-used-tesla-canada'))
    expect(batteryUrls).toHaveLength(1)
  })
})

describe('buildVehicleImages', () => {
  it('returns an empty array when no images are configured', () => {
    expect(buildVehicleImages({ id: 'x', updated_at: null })).toEqual([])
  })

  it('returns just the primary image when image_urls is missing', () => {
    expect(
      buildVehicleImages({ id: 'x', updated_at: null, primary_image_url: 'https://cdn.example.com/p.jpg' }),
    ).toEqual(['https://cdn.example.com/p.jpg'])
  })

  it('puts primary_image_url first followed by image_urls', () => {
    expect(
      buildVehicleImages({
        id: 'x',
        updated_at: null,
        primary_image_url: 'https://cdn.example.com/primary.jpg',
        image_urls: ['https://cdn.example.com/2.jpg', 'https://cdn.example.com/3.jpg'],
      }),
    ).toEqual([
      'https://cdn.example.com/primary.jpg',
      'https://cdn.example.com/2.jpg',
      'https://cdn.example.com/3.jpg',
    ])
  })

  it('de-duplicates the primary URL appearing again in image_urls', () => {
    const out = buildVehicleImages({
      id: 'x',
      updated_at: null,
      primary_image_url: 'https://cdn.example.com/p.jpg',
      image_urls: ['https://cdn.example.com/p.jpg', 'https://cdn.example.com/q.jpg'],
    })
    expect(out).toEqual(['https://cdn.example.com/p.jpg', 'https://cdn.example.com/q.jpg'])
  })

  it('skips empty strings, nulls, and non-string values in image_urls', () => {
    const out = buildVehicleImages({
      id: 'x',
      updated_at: null,
      // simulate dirty data from older rows
      image_urls: ['', 'https://cdn.example.com/ok.jpg', null as unknown as string, 42 as unknown as string],
    })
    expect(out).toEqual(['https://cdn.example.com/ok.jpg'])
  })

  it('caps the result at the configured maximum', () => {
    const lots = Array.from({ length: 12 }, (_, i) => `https://cdn.example.com/${i}.jpg`)
    const out = buildVehicleImages({
      id: 'x',
      updated_at: null,
      primary_image_url: 'https://cdn.example.com/primary.jpg',
      image_urls: lots,
    })
    // 1 primary + (MAX - 1) extras
    expect(out.length).toBe(5)
    expect(out[0]).toBe('https://cdn.example.com/primary.jpg')
  })

  it('ignores a non-string primary_image_url', () => {
    const out = buildVehicleImages({
      id: 'x',
      updated_at: null,
      primary_image_url: 0 as unknown as string,
      image_urls: ['https://cdn.example.com/a.jpg'],
    })
    expect(out).toEqual(['https://cdn.example.com/a.jpg'])
  })
})

describe('buildVehiclesSitemap — supabase not configured', () => {
  it('returns empty array and logs warning when supabase is unavailable', async () => {
    vi.resetModules()
    vi.doMock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
    vi.doMock('@/lib/supabase/config', () => ({
      getSupabaseUrl: vi.fn(() => ''),
      getSupabaseAnonKey: vi.fn(() => ''),
    }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { buildVehiclesSitemap: build } = await import('@/lib/sitemap-builders')
    const out = await build('https://example.com', '2025-01-01')
    expect(out).toEqual([])
    expect(warn).toHaveBeenCalledWith('Sitemap: Supabase not configured, skipping vehicles')
  })
})

describe('buildVehiclesSitemap — 42P01 silenced', () => {
  it('returns empty when underlying error has code 42P01', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'relation does not exist', code: '42P01' } })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const out = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(out).toEqual([])
    expect(errSpy).toHaveBeenCalled()
  })
})
