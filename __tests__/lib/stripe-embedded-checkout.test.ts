import { describe, it, expect, vi } from 'vitest'

// Mock dynamic and stripe-js before import
vi.mock('next/dynamic', () => ({
  default: vi.fn((fn: () => unknown) => fn),
}))
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({ mock: 'stripe' }),
}))
vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: vi.fn(),
  EmbeddedCheckout: vi.fn(),
}))

describe('lib/stripe/embedded-checkout', () => {
  it('getStripePromise returns null when no publishable key', async () => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const { getStripePromise } = await import('@/lib/stripe/embedded-checkout')
    expect(getStripePromise()).toBeNull()
  })

  it('getStripePromise returns a promise when key is set', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
    const { getStripePromise } = await import('@/lib/stripe/embedded-checkout')
    const result = getStripePromise()
    expect(result).not.toBeNull()
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  })

  it('getStripePromise memoizes — returns same promise on second call', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_456'
    const { getStripePromise } = await import('@/lib/stripe/embedded-checkout')
    const p1 = getStripePromise()
    const p2 = getStripePromise()
    expect(p1).toBe(p2)
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  })
})
