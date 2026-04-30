/**
 * Tests for the public-facing status allowlist in fetchVehicleForSSR.
 *
 * The actual DB query is mocked — we only verify which statuses
 * are allowed through vs filtered out.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dependencies before importing the module
vi.mock('@/lib/supabase/static', () => ({
  createStaticClient: vi.fn(),
}))

vi.mock('@/lib/drivee-db', () => ({
  getDriveeMidFromDb: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/pricing/format', () => ({
  calculateAllInPrice: vi.fn().mockReturnValue({
    vehiclePrice: 25000,
    hst: 3250,
    omvicFee: 58,
    certificationFee: 0,
    licensingFee: 120,
    total: 28428,
  }),
  safeNum: (v: unknown) => (typeof v === 'number' ? v : 0),
}))

import { createStaticClient } from '@/lib/supabase/static'

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    stock_number: 'PM1234',
    vin: '1HGCM82633A004352',
    year: 2023,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX-L',
    body_style: 'Sedan',
    exterior_color: 'White',
    interior_color: 'Black',
    price: 2500000,
    msrp: null,
    mileage: 15000,
    drivetrain: 'FWD',
    transmission: 'Automatic',
    engine: '1.5T',
    fuel_type: 'Gasoline',
    status: 'available',
    location: 'Richmond Hill, ON',
    primary_image_url: 'https://example.com/img.jpg',
    image_urls: ['https://example.com/img.jpg'],
    has_360_spin: false,
    video_url: null,
    is_certified: true,
    is_new_arrival: false,
    featured: false,
    inspection_score: null,
    inspection_date: null,
    is_ev: false,
    battery_capacity_kwh: null,
    range_miles: null,
    ev_battery_health_percent: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function setupMock(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  ;(createStaticClient as ReturnType<typeof vi.fn>).mockReturnValue({ from })
}

describe('fetchVehicleForSSR — status allowlist', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it.each(['available', 'reserved', 'pending', 'sold'])(
    'allows %s status through',
    async (status) => {
      setupMock(makeRow({ status }))
      // Re-import to get fresh cache
      const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
      const result = await fetchVehicleForSSR('550e8400-e29b-41d4-a716-446655440000')
      expect(result).not.toBeNull()
      expect(result?.status).toBe(status)
    }
  )

  it.each(['checkout_in_progress', 'deleted', 'draft'])(
    'blocks %s status (returns null)',
    async (status) => {
      setupMock(makeRow({ status }))
      const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
      const result = await fetchVehicleForSSR('550e8400-e29b-41d4-a716-446655440000')
      expect(result).toBeNull()
    }
  )

  it('returns null when DB returns null row', async () => {
    setupMock(null)
    const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
    const result = await fetchVehicleForSSR('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBeNull()
  })

  it('uses VIN lookup column for 17-char VIN format', async () => {
    setupMock(makeRow({ vin: '1HGCM82633A004352' }))
    const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
    const result = await fetchVehicleForSSR('1HGCM82633A004352')
    expect(result).not.toBeNull()
    expect(result?.vin).toBe('1HGCM82633A004352')
  })

  it('handles null/missing optional fields with fallback defaults', async () => {
    setupMock(makeRow({
      vin: null,
      stock_number: null,
      trim: null,
      body_style: null,
      exterior_color: null,
      interior_color: null,
      drivetrain: null,
      transmission: null,
      engine: null,
      fuel_type: null,
      image_urls: null,
      msrp: 3000000,
    }))
    const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
    const result = await fetchVehicleForSSR('550e8400-e29b-41d4-a716-446655440000')
    expect(result).not.toBeNull()
    expect(result?.vin).toBe("")
    expect(result?.stockNumber).toBe("")
    expect(result?.trim).toBe("")
    expect(result?.bodyStyle).toBeNull()
    expect(result?.exteriorColor).toBeNull()
    expect(result?.interiorColor).toBeNull()
    expect(result?.drivetrain).toBeNull()
    expect(result?.transmission).toBeNull()
    expect(result?.engine).toBeNull()
    expect(result?.fuelType).toBeNull()
    expect(result?.imageUrls).toEqual([])
    expect(result?.msrp).toBe(30000)
  })

  it('returns null and logs when an exception is thrown', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    ;(createStaticClient as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('connection refused')
    })
    const { fetchVehicleForSSR } = await import('@/lib/vehicles/fetch-vehicle')
    const result = await fetchVehicleForSSR('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBeNull()
    expect(errSpy).toHaveBeenCalledWith(
      '[fetchVehicleForSSR] Failed:',
      expect.any(Error),
    )
    errSpy.mockRestore()
  })
})
