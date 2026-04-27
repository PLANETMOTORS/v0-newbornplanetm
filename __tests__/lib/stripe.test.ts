import { describe, it, expect, vi } from 'vitest'

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({ mock: true })),
}))

describe('lib/stripe', () => {
  it('getStripe throws when STRIPE_SECRET_KEY is not set', async () => {
    vi.resetModules()
    delete process.env.STRIPE_SECRET_KEY
    vi.stubGlobal('window', undefined)
    const { getStripe } = await import('@/lib/stripe')
    expect(() => getStripe()).toThrow('Stripe is not configured')
  })

  it('getStripe returns instance when STRIPE_SECRET_KEY is set', async () => {
    vi.resetModules()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    vi.stubGlobal('window', undefined)
    const { getStripe } = await import('@/lib/stripe')
    expect(getStripe()).toBeDefined()
    delete process.env.STRIPE_SECRET_KEY
  })
})
