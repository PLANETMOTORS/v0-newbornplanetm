import { describe, it, expect, vi } from 'vitest'

// Stripe must be mocked as a constructor
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function() { return { mock: true } }),
}))

describe('lib/stripe', () => {
  it('getStripe throws when STRIPE_SECRET_KEY is not set', async () => {
    vi.resetModules()
    delete process.env.STRIPE_SECRET_KEY
    vi.stubGlobal('window', undefined)
    vi.mock('stripe', () => ({
      default: vi.fn().mockImplementation(function() { return { mock: true } }),
    }))
    const { getStripe } = await import('@/lib/stripe')
    expect(() => getStripe()).toThrow('Stripe is not configured')
  })

  it('getStripe returns instance when on server with key set', async () => {
    vi.resetModules()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    vi.stubGlobal('window', undefined)
    vi.mock('stripe', () => ({
      default: vi.fn().mockImplementation(function() { return { mock: true } }),
    }))
    const { getStripe } = await import('@/lib/stripe')
    const instance = getStripe()
    expect(instance).toBeDefined()
    delete process.env.STRIPE_SECRET_KEY
  })
})
