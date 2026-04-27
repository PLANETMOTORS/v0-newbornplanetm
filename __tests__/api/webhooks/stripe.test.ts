import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

// Mock next/headers before importing route
vi.mock('next/headers', () => ({ headers: vi.fn() }))

// Build a chainable mock Supabase query builder where every method returns
// itself (the same proxy), and the proxy is also a thenable that resolves
// to the supplied result.  This handles arbitrary `.update().eq().in().eq()`
// chains as well as `await supabase.from(...).select(...).eq(...).maybeSingle()`.
const DEFAULT_QUERY_RESULT: { data?: unknown; error?: unknown } = { data: null, error: null }

function createMockSupabase(queryResult: { data?: unknown; error?: unknown } = DEFAULT_QUERY_RESULT) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        // Make the proxy thenable — any `await` on the chain resolves to queryResult
        return (resolve: (v: unknown) => void) => resolve(queryResult)
      }
      // Every other property access returns a function that returns the same proxy
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }

  const proxyBuilder = () => new Proxy({}, handler)

  // rpc() resolves to { data: true, error: null } by default (transition_vehicle_status returns boolean)
  const rpcResult = { data: true, error: null }

  return {
    from: vi.fn().mockImplementation(() => proxyBuilder()),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>
}

// Mock modules so the route file can be imported
vi.mock('@/lib/stripe', () => ({ getStripe: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => createMockSupabase()),
}))

const {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handleCheckoutSessionAsyncPaymentFailed,
  handlePaymentIntentFailed,
  handlePaymentIntentSucceeded,
} = await import('@/app/api/webhooks/stripe/route')

function makeSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    payment_status: 'paid',
    metadata: {
      reservationId: 'res-1',
      vehicleId: 'veh-1',
      type: 'vehicle-reservation',
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

function makePaymentIntent(overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id: 'pi_test_123',
    metadata: {
      reservationId: 'res-1',
      vehicleId: 'veh-1',
    },
    ...overrides,
  } as unknown as Stripe.PaymentIntent
}

describe('handleCheckoutSessionCompleted', () => {
  let supabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    supabase = createMockSupabase()
  })

  it('confirms reservation and reserves vehicle when payment is settled', async () => {
    // Provide a valid reservation so validateReservationForConfirmation passes
    supabase = createMockSupabase({
      data: {
        deposit_status: 'paid',
        stripe_payment_intent_id: 'pi_test_123',
        stripe_checkout_session_id: 'cs_test_123',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    })
    const session = makeSession({ payment_status: 'paid' })
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'reserved',
    }))
  })

  it('releases vehicle when payment is unsettled', async () => {
    const session = makeSession({ payment_status: 'unpaid' })
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })

  it('releases vehicle when validation fails on paid session', async () => {
    // Mock returns reservation with missing Stripe refs → validation fails
    supabase = createMockSupabase({
      data: {
        deposit_status: 'paid',
        stripe_payment_intent_id: null,
        stripe_checkout_session_id: null,
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    })
    const session = makeSession({ payment_status: 'paid' })
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })

  it('releases vehicle when reservation fetch returns null', async () => {
    // Default mock returns data: null → reservation is null
    const session = makeSession({ payment_status: 'paid' })
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })

  it('persists stripe_checkout_session_id on paid session', async () => {
    supabase = createMockSupabase({
      data: {
        deposit_status: 'paid',
        stripe_payment_intent_id: 'pi_test_123',
        stripe_checkout_session_id: 'cs_test_123',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    })
    const session = makeSession({ payment_status: 'paid', payment_intent: 'pi_from_session' } as Partial<Stripe.Checkout.Session>)
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
  })

  it('confirms order for non-reservation checkout', async () => {
    const session = makeSession({
      payment_status: 'paid',
      metadata: { vehicleId: 'veh-2', type: 'purchase' } as Record<string, string>,
    })
    await handleCheckoutSessionCompleted(supabase, session)
    expect(supabase.from).toHaveBeenCalledWith('orders')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-2',
      p_to_status: 'pending',
    }))
  })
})

describe('handleCheckoutSessionExpired', () => {
  it('expires reservation and releases vehicle', async () => {
    const supabase = createMockSupabase()
    const session = makeSession()
    await handleCheckoutSessionExpired(supabase, session)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })
})

describe('handleCheckoutSessionAsyncPaymentFailed', () => {
  it('fails reservation and releases vehicle', async () => {
    const supabase = createMockSupabase()
    const session = makeSession()
    await handleCheckoutSessionAsyncPaymentFailed(supabase, session)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })
})

describe('handlePaymentIntentFailed', () => {
  it('marks deposit as failed and releases vehicle', async () => {
    const supabase = createMockSupabase()
    const pi = makePaymentIntent()
    await handlePaymentIntentFailed(supabase, pi)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'available',
    }))
  })
})

describe('handlePaymentIntentSucceeded', () => {
  it('confirms reservation deposit and holds vehicle', async () => {
    const supabase = createMockSupabase()
    const pi = makePaymentIntent()
    await handlePaymentIntentSucceeded(supabase, pi)
    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-1',
      p_to_status: 'reserved',
    }))
  })

  it('confirms order for non-reservation payment', async () => {
    const supabase = createMockSupabase()
    const pi = makePaymentIntent({
      metadata: { vehicleId: 'veh-2', type: 'purchase' } as Record<string, string>,
    })
    await handlePaymentIntentSucceeded(supabase, pi)
    expect(supabase.from).toHaveBeenCalledWith('orders')
    expect(supabase.rpc).toHaveBeenCalledWith('transition_vehicle_status', expect.objectContaining({
      p_vehicle_id: 'veh-2',
      p_to_status: 'pending',
    }))
  })
})
