import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import {
  validateReservationForConfirmation,
  verifyStripePaymentIntent,
  verifyStripeCheckoutSession,
  fullPaymentVerification,
} from '@/lib/reservation-payment-rules'
import type { ReservationPaymentFields } from '@/lib/reservation-payment-rules'
import { getStripe } from '@/lib/stripe'

const mockedGetStripe = vi.mocked(getStripe)

function makeReservation(overrides: Partial<ReservationPaymentFields> = {}): ReservationPaymentFields {
  return {
    deposit_status: 'paid',
    stripe_payment_intent_id: 'pi_test_123',
    stripe_checkout_session_id: 'cs_test_123',
    status: 'pending',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  }
}

describe('validateReservationForConfirmation', () => {
  it('returns valid when all conditions are met', () => {
    const result = validateReservationForConfirmation(makeReservation())
    expect(result).toEqual({ valid: true, reason: 'Payment verified' })
  })

  it('rejects when deposit_status is not paid', () => {
    const result = validateReservationForConfirmation(makeReservation({ deposit_status: 'pending' }))
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Deposit not paid')
    expect(result.reason).toContain('pending')
  })

  it('rejects when deposit_status is null', () => {
    const result = validateReservationForConfirmation(makeReservation({ deposit_status: null }))
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('unknown')
  })

  it('rejects when no Stripe payment reference exists', () => {
    const result = validateReservationForConfirmation(
      makeReservation({ stripe_payment_intent_id: null, stripe_checkout_session_id: null })
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('No Stripe payment reference')
  })

  it('accepts with only stripe_payment_intent_id', () => {
    const result = validateReservationForConfirmation(
      makeReservation({ stripe_checkout_session_id: null })
    )
    expect(result).toEqual({ valid: true, reason: 'Payment verified' })
  })

  it('accepts with only stripe_checkout_session_id', () => {
    const result = validateReservationForConfirmation(
      makeReservation({ stripe_payment_intent_id: null })
    )
    expect(result).toEqual({ valid: true, reason: 'Payment verified' })
  })

  it('rejects when reservation has expired', () => {
    const result = validateReservationForConfirmation(
      makeReservation({ expires_at: new Date(Date.now() - 60000).toISOString() })
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Reservation has expired')
  })

  it('accepts when expires_at is null (no expiry)', () => {
    const result = validateReservationForConfirmation(makeReservation({ expires_at: null }))
    expect(result).toEqual({ valid: true, reason: 'Payment verified' })
  })

  it('accepts expired reservation when skipExpiryCheck is true (webhook path)', () => {
    const result = validateReservationForConfirmation(
      makeReservation({ expires_at: new Date(Date.now() - 60000).toISOString() }),
      { skipExpiryCheck: true }
    )
    expect(result).toEqual({ valid: true, reason: 'Payment verified' })
  })
})

describe('verifyStripePaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns valid when payment intent succeeded', async () => {
    mockedGetStripe.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: 'succeeded' }),
      },
    } as never)

    const result = await verifyStripePaymentIntent('pi_test_123')
    expect(result).toEqual({ valid: true, reason: 'Stripe payment succeeded' })
  })

  it('rejects when payment intent is not succeeded', async () => {
    mockedGetStripe.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: 'requires_payment_method' }),
      },
    } as never)

    const result = await verifyStripePaymentIntent('pi_test_123')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('requires_payment_method')
  })

  it('returns invalid on Stripe API error', async () => {
    mockedGetStripe.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    } as never)

    const result = await verifyStripePaymentIntent('pi_test_123')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Network error')
  })
})

describe('verifyStripeCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns valid when checkout session is paid', async () => {
    mockedGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_status: 'paid' }),
        },
      },
    } as never)

    const result = await verifyStripeCheckoutSession('cs_test_123')
    expect(result).toEqual({ valid: true, reason: 'Stripe checkout session paid' })
  })

  it('rejects when checkout session is unpaid', async () => {
    mockedGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_status: 'unpaid' }),
        },
      },
    } as never)

    const result = await verifyStripeCheckoutSession('cs_test_123')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('unpaid')
  })

  it('returns invalid on Stripe API error', async () => {
    mockedGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockRejectedValue(new Error('Timeout')),
        },
      },
    } as never)

    const result = await verifyStripeCheckoutSession('cs_test_123')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Timeout')
  })
})

describe('fullPaymentVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails fast on local validation failure (deposit not paid)', async () => {
    const result = await fullPaymentVerification(makeReservation({ deposit_status: 'pending' }))
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Deposit not paid')
    expect(mockedGetStripe).not.toHaveBeenCalled()
  })

  it('verifies via PaymentIntent when both refs exist', async () => {
    mockedGetStripe.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: 'succeeded' }),
      },
    } as never)

    const result = await fullPaymentVerification(makeReservation())
    expect(result).toEqual({ valid: true, reason: 'Stripe payment succeeded' })
  })

  it('falls back to CheckoutSession when no PaymentIntent ref', async () => {
    mockedGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({ payment_status: 'paid' }),
        },
      },
    } as never)

    const result = await fullPaymentVerification(
      makeReservation({ stripe_payment_intent_id: null })
    )
    expect(result).toEqual({ valid: true, reason: 'Stripe checkout session paid' })
  })

  it('rejects when Stripe API says payment not succeeded', async () => {
    mockedGetStripe.mockReturnValue({
      paymentIntents: {
        retrieve: vi.fn().mockResolvedValue({ status: 'canceled' }),
      },
    } as never)

    const result = await fullPaymentVerification(makeReservation())
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('canceled')
  })
})
