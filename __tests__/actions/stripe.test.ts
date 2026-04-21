import { describe, it, expect, vi, beforeEach } from 'vitest'

// ────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Creates a minimal mock Supabase admin client.
 * `rpcResult` controls what the `rpc()` call resolves to.
 * `from` returns a chainable proxy (used by startCheckoutSession is not involved here).
 */
function createMockAdminClient(
  rpcResult: { data?: unknown; error?: { message: string } | null } = {
    data: {
      success: true,
      id: 'veh-1',
      year: 2022,
      make: 'Honda',
      model: 'Civic',
      price: 2500000,
      status: 'available',
    },
    error: null,
  },
) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
      }
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }

  return {
    from: vi.fn().mockImplementation(() => new Proxy({}, handler)),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  }
}

/**
 * Creates a minimal mock Stripe client whose checkout.sessions.create
 * resolves to a session with the given client_secret.
 */
function createMockStripe(clientSecret = 'cs_secret_test_abc') {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ client_secret: clientSecret }),
      },
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Module mocks — must be defined before dynamically importing the module
// ────────────────────────────────────────────────────────────────────────────
let mockAdminClient = createMockAdminClient()
let mockStripeClient = createMockStripe()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => mockStripeClient),
}))

// next/headers is imported by 'use server' modules in some Next.js versions
vi.mock('next/headers', () => ({ headers: vi.fn(() => new Map()) }))

const { startVehicleCheckout } = await import('@/app/actions/stripe')

// ────────────────────────────────────────────────────────────────────────────
// Shared test data
// ────────────────────────────────────────────────────────────────────────────
const baseCheckoutData = {
  vehicleId: 'veh-1',
  vehicleName: '2022 Honda Civic',
  customerEmail: 'buyer@example.com',
}

const lockSuccess = {
  success: true,
  id: 'veh-1',
  year: 2022,
  make: 'Honda',
  model: 'Civic',
  price: 2500000,
  status: 'available',
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe('startVehicleCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminClient = createMockAdminClient({ data: lockSuccess, error: null })
    mockStripeClient = createMockStripe()
    // Re-bind the mocked modules to the freshly created instances
    const { createAdminClient } = vi.mocked(await import('@/lib/supabase/admin'))
    createAdminClient.mockReturnValue(mockAdminClient as unknown as ReturnType<typeof createAdminClient>)
    const { getStripe } = vi.mocked(await import('@/lib/stripe'))
    getStripe.mockReturnValue(mockStripeClient as unknown as ReturnType<typeof getStripe>)
  })

  it('calls lock_vehicle_for_checkout RPC with p_allowed_statuses including available and reserved', async () => {
    await startVehicleCheckout(baseCheckoutData)
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'lock_vehicle_for_checkout',
      expect.objectContaining({
        p_vehicle_id: 'veh-1',
        p_allowed_statuses: expect.arrayContaining(['available', 'reserved']),
      }),
    )
  })

  it('passes exactly ["available", "reserved"] as p_allowed_statuses', async () => {
    await startVehicleCheckout(baseCheckoutData)
    const rpcCall = mockAdminClient.rpc.mock.calls[0]
    expect(rpcCall[1].p_allowed_statuses).toEqual(['available', 'reserved'])
  })

  it('returns the Stripe client_secret on successful checkout', async () => {
    const secret = await startVehicleCheckout(baseCheckoutData)
    expect(secret).toBe('cs_secret_test_abc')
  })

  it('throws when the RPC returns a lockError', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Vehicle not found' },
    })
    await expect(startVehicleCheckout(baseCheckoutData)).rejects.toThrow(
      'Failed to verify vehicle availability: Vehicle not found',
    )
  })

  it('throws when lock result success is false', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: { success: false, error: 'Vehicle is sold' },
      error: null,
    })
    await expect(startVehicleCheckout(baseCheckoutData)).rejects.toThrow('Vehicle is sold')
  })

  it('throws with fallback message when lock result has no error field', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: { success: false },
      error: null,
    })
    await expect(startVehicleCheckout(baseCheckoutData)).rejects.toThrow(
      'Vehicle is not available for checkout',
    )
  })

  it('uses deposit amount (25000 cents) when depositOnly is true', async () => {
    await startVehicleCheckout({ ...baseCheckoutData, depositOnly: true })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    const vehicleLineItem = createCall.line_items[0]
    expect(vehicleLineItem.price_data.unit_amount).toBe(25000)
  })

  it('uses vehicle price from lock result when depositOnly is false', async () => {
    await startVehicleCheckout({ ...baseCheckoutData, depositOnly: false })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    const vehicleLineItem = createCall.line_items[0]
    // lockSuccess.price = 2500000 cents
    expect(vehicleLineItem.price_data.unit_amount).toBe(2500000)
  })

  it('includes protection plan as a second line item when protectionPlanId is set', async () => {
    await startVehicleCheckout({ ...baseCheckoutData, protectionPlanId: 'essential' })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.line_items).toHaveLength(2)
    expect(createCall.line_items[1].price_data.unit_amount).toBe(195000)
  })

  it('does not include protection plan line item for an invalid plan id', async () => {
    await startVehicleCheckout({ ...baseCheckoutData, protectionPlanId: 'nonexistent' })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.line_items).toHaveLength(1)
  })

  it('passes customerEmail to stripe session when provided', async () => {
    await startVehicleCheckout({ ...baseCheckoutData, customerEmail: 'buyer@example.com' })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.customer_email).toBe('buyer@example.com')
  })

  it('does not include customer_email in stripe session when not provided', async () => {
    const { customerEmail: _e, ...dataWithoutEmail } = baseCheckoutData
    await startVehicleCheckout(dataWithoutEmail)
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.customer_email).toBeUndefined()
  })

  it('sets UTM params in metadata when provided', async () => {
    await startVehicleCheckout({
      ...baseCheckoutData,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'winter-sale',
    })
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.metadata.utm_source).toBe('google')
    expect(createCall.metadata.utm_medium).toBe('cpc')
    expect(createCall.metadata.utm_campaign).toBe('winter-sale')
  })

  it('does not include undefined UTM params in metadata', async () => {
    await startVehicleCheckout(baseCheckoutData)
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.metadata).not.toHaveProperty('utm_source')
    expect(createCall.metadata).not.toHaveProperty('utm_medium')
  })

  it('throws a config error when createAdminClient throws', async () => {
    const { createAdminClient } = vi.mocked(await import('@/lib/supabase/admin'))
    createAdminClient.mockImplementation(() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
    })
    await expect(startVehicleCheckout(baseCheckoutData)).rejects.toThrow('Service configuration error')
  })

  it('uses acss_debit payment method when STRIPE_ENABLE_ACSS_DEBIT=true', async () => {
    process.env.STRIPE_ENABLE_ACSS_DEBIT = 'true'
    try {
      await startVehicleCheckout(baseCheckoutData)
      const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
      expect(createCall.payment_method_types).toContain('acss_debit')
      expect(createCall.payment_method_types).toContain('card')
    } finally {
      delete process.env.STRIPE_ENABLE_ACSS_DEBIT
    }
  })

  it('uses only card payment method when STRIPE_ENABLE_ACSS_DEBIT is not set', async () => {
    delete process.env.STRIPE_ENABLE_ACSS_DEBIT
    await startVehicleCheckout(baseCheckoutData)
    const createCall = mockStripeClient.checkout.sessions.create.mock.calls[0][0]
    expect(createCall.payment_method_types).toEqual(['card'])
  })
})