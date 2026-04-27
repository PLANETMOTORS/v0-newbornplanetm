import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers and next/server
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn(() => ({ getAll: () => [] })) }))

// Track the mock supabase instances
let mockUserEmail: string | null = 'admin@planetmotors.ca'
let mockReservationData: Record<string, unknown> | null = null
let mockReservationError: { message: string } | null = null
let mockUpdateData: Record<string, unknown> | null = { id: 'res-1', status: 'confirmed' }
let mockUpdateError: { message: string } | null = null
let mockPaymentVerificationResult = { valid: true, reason: 'Payment verified' }

// Mock fullPaymentVerification
vi.mock('@/lib/reservation-payment-rules', () => ({
  fullPaymentVerification: vi.fn(async () => mockPaymentVerificationResult),
}))

// Build chainable mock
function createChainableMock(result: { data: unknown; error: unknown }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  return () => new Proxy({}, handler)
}

// Mock Supabase server client (user auth)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUserEmail ? { email: mockUserEmail } : null },
      })),
    },
  })),
}))

// Mock Supabase service client (admin operations)
const mockFrom = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock admin emails
vi.mock('@/lib/admin', () => ({
  ADMIN_EMAILS: ['admin@planetmotors.ca', 'toni@planetmotors.ca'],
}))

const { PATCH } = await import('@/app/api/v1/admin/reservations/route')

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3001/api/v1/admin/reservations', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/v1/admin/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserEmail = 'admin@planetmotors.ca'
    mockReservationData = {
      deposit_status: 'paid',
      stripe_payment_intent_id: 'pi_test_123',
      stripe_checkout_session_id: 'cs_test_123',
      status: 'pending',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }
    mockReservationError = null
    mockUpdateData = { id: 'res-1', status: 'confirmed' }
    mockUpdateError = null
    mockPaymentVerificationResult = { valid: true, reason: 'Payment verified' }

    // Setup mockFrom for select (fetch) and update chains
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reservations') {
        const selectHandler: ProxyHandler<Record<string, unknown>> = {
          get(_target, prop: string) {
            if (prop === 'then') {
              return (resolve: (v: unknown) => void) =>
                resolve({ data: mockReservationData, error: mockReservationError })
            }
            if (prop === 'select') {
              return (..._args: unknown[]) => new Proxy({}, selectHandler)
            }
            if (prop === 'update') {
              return (..._args: unknown[]) => {
                const updateHandler: ProxyHandler<Record<string, unknown>> = {
                  get(_t, p: string) {
                    if (p === 'then') {
                      return (resolve: (v: unknown) => void) =>
                        resolve({ data: mockUpdateData, error: mockUpdateError })
                    }
                    return (..._a: unknown[]) => new Proxy({}, updateHandler)
                  },
                }
                return new Proxy({}, updateHandler)
              }
            }
            return (..._args: unknown[]) => new Proxy({}, selectHandler)
          },
        }
        return new Proxy({}, selectHandler)
      }
      return createChainableMock({ data: null, error: null })()
    })
  })

  it('returns 401 for non-admin user', async () => {
    mockUserEmail = 'user@example.com'
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 401 for unauthenticated user', async () => {
    mockUserEmail = null
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when reservation ID is missing', async () => {
    const req = makeRequest({ status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Reservation ID required')
  })

  it('returns 422 when payment verification fails', async () => {
    mockPaymentVerificationResult = { valid: false, reason: 'Deposit not paid (current status: pending)' }
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toContain('Cannot confirm reservation')
    expect(body.error).toContain('Deposit not paid')
  })

  it('returns 404 when reservation not found', async () => {
    mockReservationData = null
    mockReservationError = null
    const req = makeRequest({ id: 'res-nonexistent', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(404)
  })

  it('allows confirmation when payment is verified', async () => {
    mockPaymentVerificationResult = { valid: true, reason: 'Stripe payment succeeded' }
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reservation).toBeTruthy()
  })

  it('allows non-confirm status changes without payment validation', async () => {
    // Cancellation should work even without valid payment
    mockPaymentVerificationResult = { valid: false, reason: 'Deposit not paid' }
    const req = makeRequest({ id: 'res-1', status: 'cancelled' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(200)
  })

  it('returns 422 when database trigger rejects confirm', async () => {
    mockUpdateError = { message: 'Cannot confirm reservation: payment not verified' }
    mockUpdateData = null
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toContain('Cannot confirm reservation')
  })

  it('returns 500 on generic database error', async () => {
    mockUpdateError = { message: 'Connection timeout' }
    mockUpdateData = null
    const req = makeRequest({ id: 'res-1', status: 'confirmed' })
    const res = await PATCH(req as never)
    expect(res.status).toBe(500)
  })
})
