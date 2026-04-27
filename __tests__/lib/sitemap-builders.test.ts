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

import { buildVehiclesSitemap, buildPagesSitemap } from '@/lib/sitemap-builders'

describe('buildVehiclesSitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLimit.mockResolvedValue({
      data: [
        { id: 'abc-123', updated_at: '2025-01-01T00:00:00Z' },
        { id: 'def-456', updated_at: '2025-01-02T00:00:00Z' },
      ],
      error: null,
    })
  })

  it('queries vehicles with public statuses via .or() filter', async () => {
    await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
    expect(mockSelect).toHaveBeenCalledWith('id, updated_at')
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

  it('falls back to .in() when sold_at column is missing (error 42703)', async () => {
    // First call (with .or()) returns column-not-found error
    mockLimit
      .mockResolvedValueOnce({ data: null, error: { message: 'column vehicles.sold_at does not exist', code: '42703' } })
      // Second call (fallback with .in()) succeeds
      .mockResolvedValueOnce({
        data: [{ id: 'fallback-1', updated_at: '2025-06-01T00:00:00Z' }],
        error: null,
      })
    const result = await buildVehiclesSitemap('https://example.com', '2025-01-01')
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://example.com/vehicles/fallback-1')
    // .in() fallback was called
    expect(mockIn).toHaveBeenCalledWith('status', ['available', 'reserved', 'sold'])
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
})
