import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockStaleCheckouts: Array<Record<string, unknown>> = []
let mockCheckoutErr: { message: string } | null = null
let mockStaleReserved: Array<Record<string, unknown>> = []
let mockReservedErr: { message: string } | null = null
let mockActiveReservations: Array<Record<string, unknown>> = []
let mockActiveReservationsErr: { message: string } | null = null
let mockUpdateErr: { message: string } | null = null
let createAdminShouldThrow = false

function buildSelectChain(rows: unknown, error: unknown) {
  // Mimics adminClient.from(...).select(...).eq(...).lt(...) and from(...).select(...).eq(...).in(...).limit(...)
  // The chain awaits on the final method — vehicles.lt() and reservations.limit().
  const finalResult = { data: rows, error }
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(finalResult)
      }
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

const fromImpl = vi.fn((table: string) => {
  if (table === 'vehicles') {
    // The route calls vehicles.select(...).eq("status", X).lt(...) twice —
    // first for "checkout_in_progress", then for "reserved". Differentiate
    // by capturing the .eq("status", X) value so each call resolves to the
    // appropriate stale-row fixture.
    return {
      select: () => ({
        eq: (_col: string, status: string) => ({
          lt: () => {
            if (status === 'checkout_in_progress') {
              return Promise.resolve({
                data: mockStaleCheckouts,
                error: mockCheckoutErr,
              })
            }
            if (status === 'reserved') {
              return Promise.resolve({
                data: mockStaleReserved,
                error: mockReservedErr,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: mockUpdateErr }),
        }),
      }),
    }
  }
  if (table === 'reservations') {
    return {
      select: () => ({
        eq: () => ({
          in: () => ({
            limit: () => Promise.resolve({
              data: mockActiveReservations,
              error: mockActiveReservationsErr,
            }),
          }),
        }),
      }),
    }
  }
  return buildSelectChain([], null)
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    if (createAdminShouldThrow) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
    }
    return { from: fromImpl }
  }),
}))

const { GET } = await import('@/app/api/cron/vehicle-release/route')

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/cron/vehicle-release', {
    method: 'GET',
    headers,
  })
}

describe('GET /api/cron/vehicle-release', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStaleCheckouts = []
    mockCheckoutErr = null
    mockStaleReserved = []
    mockReservedErr = null
    mockActiveReservations = []
    mockActiveReservationsErr = null
    mockUpdateErr = null
    createAdminShouldThrow = false
    process.env.CRON_SECRET = 'test-secret'
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('authentication', () => {
    it('returns 401 when CRON_SECRET is set and Authorization header does not match', async () => {
      const res = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }))
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when CRON_SECRET is set and no Authorization header is provided', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(401)
    })

    it('returns 503 when running in production with CRON_SECRET unset (fail-closed)', async () => {
      delete process.env.CRON_SECRET
      const res = await GET(makeRequest({ authorization: 'Bearer anything' }))
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toMatch(/CRON_SECRET/)
    })

    it('allows the request through in non-production with CRON_SECRET unset (dev convenience)', async () => {
      delete process.env.CRON_SECRET
      process.env.NODE_ENV = 'development'
      const res = await GET(makeRequest())
      // Should reach the admin-client step (which our mock returns OK for)
      expect(res.status).toBe(200)
    })

    it('passes when Authorization matches the configured CRON_SECRET', async () => {
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
    })
  })

  describe('admin client provisioning', () => {
    it('returns 503 when the admin client cannot be created', async () => {
      createAdminShouldThrow = true
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toMatch(/Admin client/i)
    })
  })

  describe('happy path — no stale vehicles', () => {
    it('returns 200 with released=0 when no stale checkouts or reservations exist', async () => {
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.released).toBe(0)
      expect(body.vehicles).toEqual([])
    })
  })

  describe('release behaviour', () => {
    it('releases stale checkout_in_progress vehicles and reports them', async () => {
      mockStaleCheckouts = [
        { id: 'v1', vin: 'VIN001', year: 2024, make: 'Tesla', model: 'Model 3' },
      ]
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.released).toBe(1)
      expect(body.vehicles[0]).toMatch(/Tesla/)
      expect(body.vehicles[0]).toMatch(/checkout_in_progress/)
    })

    it('reports update errors without breaking the response', async () => {
      mockStaleCheckouts = [
        { id: 'v1', vin: 'VIN002', year: 2023, make: 'Ford', model: 'F-150' },
      ]
      mockUpdateErr = { message: 'row-level security violation' }
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.released).toBe(0)
      expect(body.errors).toBeDefined()
      expect(body.errors[0]).toMatch(/release VIN002/)
    })

    it('skips reserved vehicles that still have an active reservation', async () => {
      mockStaleReserved = [
        { id: 'v3', vin: 'VIN003', year: 2024, make: 'Honda', model: 'Civic' },
      ]
      mockActiveReservations = [{ id: 'res-active' }]
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.released).toBe(0)
      expect(body.vehicles).toEqual([])
    })

    it('releases reserved vehicles that have no active reservation', async () => {
      mockStaleReserved = [
        { id: 'v4', vin: 'VIN004', year: 2025, make: 'Toyota', model: 'Camry' },
      ]
      mockActiveReservations = []
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.released).toBe(1)
      expect(body.vehicles[0]).toMatch(/Toyota/)
      expect(body.vehicles[0]).toMatch(/reserved/)
    })

    it('reports query errors without crashing', async () => {
      mockCheckoutErr = { message: 'connection refused' }
      const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.errors).toBeDefined()
      expect(body.errors.some((e: string) => e.includes('checkout query'))).toBe(true)
    })
  })
})
