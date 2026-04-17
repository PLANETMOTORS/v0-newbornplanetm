import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Hoisted setup: mock dependencies before any module is imported.
// vi.hoisted() runs synchronously before vi.mock() factory callbacks.
// ─────────────────────────────────────────────────────────────────────────────
const { mockSupabaseChain, mockCreateClient } = vi.hoisted(() => {
  // Default resolved data for supabase vehicle queries
  let resolvedVehicles: { id: string; updated_at: string }[] = []
  let resolvedError: { message: string; code?: string } | null = null

  function makeChain(): Record<string, unknown> {
    const chain: Record<string, unknown> = {}
    const chainMethods = ['select', 'eq', 'order']
    for (const method of chainMethods) {
      chain[method] = (..._args: unknown[]) => makeChain()
    }
    // limit() terminates the vehicle query chain
    chain['limit'] = (..._args: unknown[]) =>
      Promise.resolve({ data: resolvedVehicles, error: resolvedError })
    return chain
  }

  const clientInstance = { from: vi.fn().mockImplementation(() => makeChain()) }
  const mockCreateClient = vi.fn().mockResolvedValue(clientInstance)

  const mockSupabaseChain = {
    setVehicles(vehicles: { id: string; updated_at: string }[]) {
      resolvedVehicles = vehicles
      resolvedError = null
    },
    setError(error: { message: string; code?: string }) {
      resolvedVehicles = []
      resolvedError = error
    },
    reset() {
      resolvedVehicles = []
      resolvedError = null
    },
  }

  return { mockSupabaseChain, mockCreateClient }
})

// Mock next/headers (required by @/lib/supabase/server internally)
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

// ─────────────────────────────────────────────────────────────────────────────
// Import module under test (after mocks are registered)
// ─────────────────────────────────────────────────────────────────────────────
const { default: sitemapFn, generateSitemaps } = await import('@/app/sitemap')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://www.planetmotors.ca'

beforeEach(() => {
  mockSupabaseChain.reset()
  // Ensure a stable base URL for all tests
  process.env.NEXT_PUBLIC_SITE_URL = BASE_URL
})

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL
})

// ─────────────────────────────────────────────────────────────────────────────
// generateSitemaps()
// ─────────────────────────────────────────────────────────────────────────────
describe('generateSitemaps', () => {
  it('returns exactly three sitemap entries with ids 0, 1, and 2', async () => {
    const result = await generateSitemaps()
    expect(result).toHaveLength(3)
    expect(result).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — id passed as plain number (synchronous value)
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() with plain number id', () => {
  it('id=0 returns pages sitemap (non-empty array of URL objects)', async () => {
    const result = await sitemapFn({ id: 0 })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('lastModified')
    expect(result[0]).toHaveProperty('priority')
  })

  it('id=0 all URLs start with the configured base URL', async () => {
    const result = await sitemapFn({ id: 0 })
    for (const entry of result) {
      expect(entry.url).toMatch(/^https?:\/\//)
    }
  })

  it('id=0 pages sitemap includes the homepage URL', async () => {
    const result = await sitemapFn({ id: 0 })
    const urls = result.map((e) => e.url)
    expect(urls).toContain(`${BASE_URL}`)
  })

  it('id=0 pages sitemap includes the inventory URL', async () => {
    const result = await sitemapFn({ id: 0 })
    const urls = result.map((e) => e.url)
    expect(urls).toContain(`${BASE_URL}/inventory`)
  })

  it('id=1 returns vehicle sitemap using supabase data', async () => {
    mockSupabaseChain.setVehicles([
      { id: 'abc-123', updated_at: '2026-01-01T00:00:00Z' },
      { id: 'def-456', updated_at: '2026-01-02T00:00:00Z' },
    ])
    const result = await sitemapFn({ id: 1 })
    expect(result).toHaveLength(2)
    expect(result[0].url).toContain('/vehicles/abc-123')
    expect(result[1].url).toContain('/vehicles/def-456')
  })

  it('id=1 vehicle entries use the vehicle updated_at as lastModified', async () => {
    mockSupabaseChain.setVehicles([
      { id: 'v1', updated_at: '2026-03-15T10:00:00Z' },
    ])
    const result = await sitemapFn({ id: 1 })
    expect(result[0].lastModified).toBe('2026-03-15T10:00:00Z')
  })

  it('id=1 with no vehicles returns empty array', async () => {
    mockSupabaseChain.setVehicles([])
    const result = await sitemapFn({ id: 1 })
    expect(result).toEqual([])
  })

  it('id=2 returns blog sitemap (non-empty array of URL objects)', async () => {
    const result = await sitemapFn({ id: 2 })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('lastModified')
  })

  it('id=2 blog entries have /blog/ in their URLs', async () => {
    const result = await sitemapFn({ id: 2 })
    for (const entry of result) {
      expect(entry.url).toContain('/blog/')
    }
  })

  it('id=99 (unknown) returns an empty array', async () => {
    const result = await sitemapFn({ id: 99 })
    expect(result).toEqual([])
  })

  it('id=-1 (negative, unrecognized) returns an empty array', async () => {
    const result = await sitemapFn({ id: -1 })
    expect(result).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — id passed as Promise<number>  (Next.js 15+ behaviour)
// This is the primary change introduced in this PR.
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() with Promise<number> id — Next.js 15+ compatibility', () => {
  it('resolves id=0 from a Promise and returns pages sitemap', async () => {
    const result = await sitemapFn({ id: Promise.resolve(0) })
    expect(result.length).toBeGreaterThan(0)
    const urls = result.map((e) => e.url)
    expect(urls.some((u) => u.includes('/inventory'))).toBe(true)
  })

  it('resolves id=1 from a Promise and returns vehicle sitemap', async () => {
    mockSupabaseChain.setVehicles([
      { id: 'promise-vehicle', updated_at: '2026-04-01T00:00:00Z' },
    ])
    const result = await sitemapFn({ id: Promise.resolve(1) })
    expect(result).toHaveLength(1)
    expect(result[0].url).toContain('/vehicles/promise-vehicle')
  })

  it('resolves id=2 from a Promise and returns blog sitemap', async () => {
    const result = await sitemapFn({ id: Promise.resolve(2) })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.url.includes('/blog/'))).toBe(true)
  })

  it('resolves unknown id from a Promise and returns empty array', async () => {
    const result = await sitemapFn({ id: Promise.resolve(999) })
    expect(result).toEqual([])
  })

  it('handles a delayed Promise (simulates async param resolution)', async () => {
    const delayedId = new Promise<number>((resolve) =>
      setTimeout(() => resolve(0), 5),
    )
    const result = await sitemapFn({ id: delayedId })
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — id coercion via Number()
// Next.js may pass URL params as strings; the code calls Number(id).
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() id coercion via Number()', () => {
  it('string "0" coerces to 0 and returns pages sitemap', async () => {
    // Cast to satisfy TypeScript — runtime passes any value
    const result = await sitemapFn({ id: '0' as unknown as number })
    expect(result.length).toBeGreaterThan(0)
    const urls = result.map((e) => e.url)
    expect(urls.some((u) => u === BASE_URL || u === `${BASE_URL}/`)).toBe(true)
  })

  it('string "1" coerces to 1 and returns vehicle sitemap', async () => {
    mockSupabaseChain.setVehicles([{ id: 'str-v', updated_at: '2026-01-01T00:00:00Z' }])
    const result = await sitemapFn({ id: '1' as unknown as number })
    expect(result).toHaveLength(1)
    expect(result[0].url).toContain('/vehicles/str-v')
  })

  it('string "2" coerces to 2 and returns blog sitemap', async () => {
    const result = await sitemapFn({ id: '2' as unknown as number })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.url.includes('/blog/'))).toBe(true)
  })

  it('string "99" coerces to 99 and returns empty array', async () => {
    const result = await sitemapFn({ id: '99' as unknown as number })
    expect(result).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — vehicle sitemap error handling
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() vehicle sitemap error handling', () => {
  it('permanent error (code 42P01 — table missing) returns empty array', async () => {
    mockSupabaseChain.setError({ message: 'relation "vehicles" does not exist', code: '42P01' })
    const result = await sitemapFn({ id: 1 })
    expect(result).toEqual([])
  })

  it('transient error (no code) re-throws so Next.js returns 500', async () => {
    mockSupabaseChain.setError({ message: 'connection timeout' })
    await expect(sitemapFn({ id: 1 })).rejects.toThrow('connection timeout')
  })

  it('transient error with non-permanent code re-throws', async () => {
    mockSupabaseChain.setError({ message: 'internal error', code: '500' })
    await expect(sitemapFn({ id: 1 })).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — console.log calls are absent (removed in this PR)
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() does not call console.log', () => {
  it('no console.log on pages sitemap (id=0)', async () => {
    const spy = vi.spyOn(console, 'log')
    await sitemapFn({ id: 0 })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('no console.log on vehicle sitemap (id=1)', async () => {
    mockSupabaseChain.setVehicles([{ id: 'v1', updated_at: '2026-01-01T00:00:00Z' }])
    const spy = vi.spyOn(console, 'log')
    await sitemapFn({ id: 1 })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('no console.log on blog sitemap (id=2)', async () => {
    const spy = vi.spyOn(console, 'log')
    await sitemapFn({ id: 2 })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('no console.log on unknown id (id=99)', async () => {
    const spy = vi.spyOn(console, 'log')
    await sitemapFn({ id: 99 })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('no console.log when Promise id resolves to pages (id=Promise.resolve(0))', async () => {
    const spy = vi.spyOn(console, 'log')
    await sitemapFn({ id: Promise.resolve(0) })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sitemap() — URL structure validation
// ─────────────────────────────────────────────────────────────────────────────
describe('sitemap() URL structure', () => {
  it('pages sitemap entries each have url, lastModified, changeFrequency, and priority', async () => {
    const result = await sitemapFn({ id: 0 })
    for (const entry of result.slice(0, 5)) {
      expect(entry).toHaveProperty('url')
      expect(entry).toHaveProperty('lastModified')
      expect(entry).toHaveProperty('changeFrequency')
      expect(entry).toHaveProperty('priority')
    }
  })

  it('blog sitemap entries each have url, lastModified, changeFrequency, and priority', async () => {
    const result = await sitemapFn({ id: 2 })
    for (const entry of result) {
      expect(entry).toHaveProperty('url')
      expect(entry).toHaveProperty('lastModified')
      expect(entry).toHaveProperty('changeFrequency')
      expect(entry).toHaveProperty('priority')
    }
  })

  it('vehicle sitemap entries each have url, lastModified, changeFrequency, and priority', async () => {
    mockSupabaseChain.setVehicles([{ id: 'vx', updated_at: '2026-01-01T00:00:00Z' }])
    const result = await sitemapFn({ id: 1 })
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('lastModified')
    expect(result[0]).toHaveProperty('changeFrequency')
    expect(result[0]).toHaveProperty('priority')
  })

  it('all pages sitemap URLs are absolute (start with http)', async () => {
    const result = await sitemapFn({ id: 0 })
    for (const entry of result) {
      expect(entry.url).toMatch(/^https?:\/\//)
    }
  })

  it('blog sitemap has weekly changeFrequency', async () => {
    const result = await sitemapFn({ id: 2 })
    for (const entry of result) {
      expect(entry.changeFrequency).toBe('weekly')
    }
  })

  it('blog sitemap priority is 0.6', async () => {
    const result = await sitemapFn({ id: 2 })
    for (const entry of result) {
      expect(entry.priority).toBe(0.6)
    }
  })

  it('vehicle sitemap priority is 0.75', async () => {
    mockSupabaseChain.setVehicles([{ id: 'v1', updated_at: '2026-01-01T00:00:00Z' }])
    const result = await sitemapFn({ id: 1 })
    expect(result[0].priority).toBe(0.75)
  })

  it('vehicle sitemap has daily changeFrequency', async () => {
    mockSupabaseChain.setVehicles([{ id: 'v1', updated_at: '2026-01-01T00:00:00Z' }])
    const result = await sitemapFn({ id: 1 })
    expect(result[0].changeFrequency).toBe('daily')
  })
})
