/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pushEvent, clearEcommerceObject } from '@/lib/tracking/data-layer'

type DLWindow = Window & typeof globalThis & { dataLayer: Record<string, unknown>[] }

describe('pushEvent', () => {
  beforeEach(() => {
    ;(window as DLWindow).dataLayer = []
  })

  it('pushes an event to dataLayer', () => {
    pushEvent({ event: 'test_event' })
    const dl = (window as DLWindow).dataLayer
    expect(dl).toHaveLength(1)
    expect(dl[0].event).toBe('test_event')
  })

  it('adds event_time_iso to every event', () => {
    pushEvent({ event: 'test' })
    const dl = (window as DLWindow).dataLayer
    expect(dl[0].event_time_iso).toBeDefined()
    expect(typeof dl[0].event_time_iso).toBe('string')
  })

  it('replaces undefined values with null', () => {
    pushEvent({ event: 'test', value: undefined })
    const dl = (window as DLWindow).dataLayer
    expect(dl[0].value).toBeNull()
  })

  it('warns about PII keys in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    pushEvent({ event: 'test', email: 'test@example.com' } as Record<string, unknown> & { event: string })

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('PII keys'),
      expect.arrayContaining(['email']),
    )

    process.env.NODE_ENV = origEnv
    warnSpy.mockRestore()
  })

  it('does not warn about PII keys in production', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    pushEvent({ event: 'test', email: 'test@example.com' } as Record<string, unknown> & { event: string })

    expect(warnSpy).not.toHaveBeenCalled()

    process.env.NODE_ENV = origEnv
    warnSpy.mockRestore()
  })

  it('detects nested PII keys', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    pushEvent({ event: 'test', user: { phone: '555-0100' } } as Record<string, unknown> & { event: string })

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('PII keys'),
      expect.arrayContaining(['user.phone']),
    )

    process.env.NODE_ENV = origEnv
    warnSpy.mockRestore()
  })

  it('handles arrays in payload for PII detection', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    pushEvent({ event: 'test', items: [{ email: 'a@b.com' }] } as Record<string, unknown> & { event: string })

    expect(warnSpy).toHaveBeenCalled()

    process.env.NODE_ENV = origEnv
    warnSpy.mockRestore()
  })

  it('initializes dataLayer if missing', () => {
    ;(window as Window & typeof globalThis & { dataLayer?: unknown[] }).dataLayer = undefined as unknown as Record<string, unknown>[]
    pushEvent({ event: 'init_test' })
    const dl = (window as DLWindow).dataLayer
    expect(dl).toHaveLength(1)
  })
})

describe('clearEcommerceObject', () => {
  beforeEach(() => {
    ;(window as DLWindow).dataLayer = []
  })

  it('pushes a clear_ecommerce event', () => {
    clearEcommerceObject()
    const dl = (window as DLWindow).dataLayer
    expect(dl[0].event).toBe('clear_ecommerce')
    expect(dl[0].ecommerce).toBeNull()
  })
})
