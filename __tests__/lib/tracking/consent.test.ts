/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  readCookieYesConsent,
  readStoredConsent,
  getConsentForEvent,
  toGoogleConsentState,
  updateGoogleConsent,
} from '@/lib/tracking/consent'

describe('toGoogleConsentState', () => {
  it('maps analytics=true and marketing=true to granted', () => {
    const result = toGoogleConsentState({ analytics: true, marketing: true })
    expect(result.analytics_storage).toBe('granted')
    expect(result.ad_storage).toBe('granted')
    expect(result.ad_user_data).toBe('granted')
    expect(result.ad_personalization).toBe('granted')
  })

  it('maps analytics=false and marketing=false to denied', () => {
    const result = toGoogleConsentState({ analytics: false, marketing: false })
    expect(result.analytics_storage).toBe('denied')
    expect(result.ad_storage).toBe('denied')
  })

  it('defaults functionality_storage to granted', () => {
    const result = toGoogleConsentState({ analytics: false, marketing: false })
    expect(result.functionality_storage).toBe('granted')
  })

  it('defaults security_storage to granted', () => {
    const result = toGoogleConsentState({ analytics: false, marketing: false })
    expect(result.security_storage).toBe('granted')
  })

  it('respects explicit functionality value', () => {
    const result = toGoogleConsentState({ analytics: false, marketing: false, functionality: false })
    expect(result.functionality_storage).toBe('denied')
  })
})

describe('readCookieYesConsent', () => {
  beforeEach(() => {
    document.cookie = 'cookieyes-consent=; max-age=0'
  })

  it('returns null when no cookieyes-consent cookie exists', () => {
    expect(readCookieYesConsent()).toBeNull()
  })

  it('parses granted analytics from cookieyes cookie', () => {
    document.cookie = 'cookieyes-consent=analytics:yes,advertisement:yes'
    const result = readCookieYesConsent()
    expect(result).not.toBeNull()
    expect(result?.analytics_storage).toBe('granted')
    expect(result?.ad_storage).toBe('granted')
    expect(result?.source).toBe('cookieyes')
  })

  it('parses denied marketing from cookieyes cookie', () => {
    document.cookie = 'cookieyes-consent=analytics:yes,advertisement:no'
    const result = readCookieYesConsent()
    expect(result?.analytics_storage).toBe('granted')
    expect(result?.ad_storage).toBe('denied')
  })
})

describe('readStoredConsent', () => {
  beforeEach(() => {
    sessionStorage.removeItem('pm_consent_v1')
  })

  it('returns null when no consent is stored', () => {
    expect(readStoredConsent()).toBeNull()
  })

  it('reads stored consent from sessionStorage', () => {
    const consent = {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
      captured_at: '2026-01-01T00:00:00.000Z',
    }
    sessionStorage.setItem('pm_consent_v1', JSON.stringify(consent))
    const result = readStoredConsent()
    expect(result?.analytics_storage).toBe('granted')
    expect(result?.ad_storage).toBe('denied')
  })
})

describe('getConsentForEvent', () => {
  beforeEach(() => {
    sessionStorage.removeItem('pm_consent_v1')
    document.cookie = 'cookieyes-consent=; max-age=0'
  })

  it('returns empty object when no consent is stored', () => {
    expect(getConsentForEvent()).toEqual({})
  })

  it('returns consent fields from stored consent', () => {
    const consent = {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
      security_storage: 'granted',
      captured_at: '2026-01-01T00:00:00.000Z',
    }
    sessionStorage.setItem('pm_consent_v1', JSON.stringify(consent))
    const result = getConsentForEvent()
    expect(result.consent_analytics).toBe('granted')
    expect(result.consent_marketing).toBe('granted')
    expect(result.consent_source).toBe('session')
  })
})

describe('updateGoogleConsent', () => {
  beforeEach(() => {
    ;(window as Window & typeof globalThis & { dataLayer?: unknown[] }).dataLayer = []
  })

  it('pushes consent_update_bridge event to dataLayer', () => {
    updateGoogleConsent({ analytics: true, marketing: false })
    const dl = (window as Window & typeof globalThis & { dataLayer: Record<string, unknown>[] }).dataLayer
    const bridgeEvent = dl.find((e) => e.event === 'consent_update_bridge')
    expect(bridgeEvent).toBeDefined()
    expect(bridgeEvent?.analytics_storage).toBe('granted')
    expect(bridgeEvent?.ad_storage).toBe('denied')
  })

  it('calls gtag if available', () => {
    const calls: unknown[][] = []
    ;(window as Window & typeof globalThis & { gtag?: (...args: [string, ...unknown[]]) => void }).gtag = (...args: [string, ...unknown[]]) => {
      calls.push(args)
    }
    const result = updateGoogleConsent({ analytics: true, marketing: true })
    expect(result?.analytics_storage).toBe('granted')
    expect(calls.length).toBeGreaterThan(0)
    ;(window as Window & typeof globalThis & { gtag?: (...args: [string, ...unknown[]]) => void }).gtag = undefined
  })
})
