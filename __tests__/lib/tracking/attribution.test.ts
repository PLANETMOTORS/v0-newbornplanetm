/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildAttributionFromLocation,
  captureAttributionFromUrl,
  readStoredAttribution,
  persistAttribution,
  getAttributionForEvent,
} from '@/lib/tracking/attribution'
import type { AttributionPayload } from '@/lib/tracking/types'

function setLocation(url: string, referrer = '') {
  const parsed = new URL(url)
  Object.defineProperty(window, 'location', {
    value: {
      href: parsed.href,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
    },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    writable: true,
    configurable: true,
  })
}

describe('buildAttributionFromLocation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('captures UTM params from URL', () => {
    setLocation('https://planetmotors.ca/?utm_source=google&utm_medium=cpc&utm_campaign=spring', '')
    const result = buildAttributionFromLocation()
    expect(result).not.toBeNull()
    expect(result?.utm_source).toBe('google')
    expect(result?.utm_medium).toBe('cpc')
    expect(result?.utm_campaign).toBe('spring')
  })

  it('captures gclid from URL', () => {
    setLocation('https://planetmotors.ca/?gclid=abc123', '')
    const result = buildAttributionFromLocation()
    expect(result).not.toBeNull()
    expect(result?.gclid).toBe('abc123')
  })

  it('captures fbclid from URL', () => {
    setLocation('https://planetmotors.ca/?fbclid=fb_abc', '')
    const result = buildAttributionFromLocation()
    expect(result?.fbclid).toBe('fb_abc')
  })

  it('captures ttclid from URL', () => {
    setLocation('https://planetmotors.ca/?ttclid=tt_abc', '')
    const result = buildAttributionFromLocation()
    expect(result?.ttclid).toBe('tt_abc')
  })

  it('captures msclkid from URL', () => {
    setLocation('https://planetmotors.ca/?msclkid=ms_abc', '')
    const result = buildAttributionFromLocation()
    expect(result?.msclkid).toBe('ms_abc')
  })

  it('infers organic source from Google referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://www.google.com/search?q=planet+motors')
    const result = buildAttributionFromLocation()
    expect(result?.utm_source).toBe('google.com')
    expect(result?.utm_medium).toBe('organic')
  })

  it('infers social source from Facebook referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://www.facebook.com/share')
    const result = buildAttributionFromLocation()
    expect(result?.utm_source).toBe('facebook.com')
    expect(result?.utm_medium).toBe('social')
  })

  it('infers social source from TikTok referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://www.tiktok.com/@pm')
    const result = buildAttributionFromLocation()
    expect(result?.utm_medium).toBe('social')
  })

  it('infers referral source from unknown referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://autotrader.ca/listing/123')
    const result = buildAttributionFromLocation()
    expect(result?.utm_source).toBe('autotrader.ca')
    expect(result?.utm_medium).toBe('referral')
  })

  it('returns null for internal referrer without campaign', () => {
    setLocation('https://planetmotors.ca/inventory', 'https://planetmotors.ca/')
    const result = buildAttributionFromLocation()
    expect(result).toBeNull()
  })

  it('returns null for direct visit without includeDirect', () => {
    setLocation('https://planetmotors.ca/', '')
    const result = buildAttributionFromLocation()
    expect(result).toBeNull()
  })

  it('returns attribution for direct visit with includeDirect', () => {
    setLocation('https://planetmotors.ca/', '')
    const result = buildAttributionFromLocation({ includeDirect: true })
    expect(result).not.toBeNull()
    expect(result?.utm_source).toBe('direct')
    expect(result?.utm_medium).toBe('none')
  })

  it('includes landing page and referrer', () => {
    setLocation('https://planetmotors.ca/?gclid=x', 'https://google.com')
    const result = buildAttributionFromLocation()
    expect(result?.landing_page).toBe('https://planetmotors.ca/?gclid=x')
    expect(result?.referrer).toBe('https://google.com')
    expect(result?.captured_at).toBeDefined()
  })

  it('detects Bing organic referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://www.bing.com/search?q=test')
    const result = buildAttributionFromLocation()
    expect(result?.utm_medium).toBe('organic')
  })

  it('detects LinkedIn social referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://linkedin.com/post/123')
    const result = buildAttributionFromLocation()
    expect(result?.utm_medium).toBe('social')
  })

  it('detects YouTube social referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://youtube.com/watch?v=abc')
    const result = buildAttributionFromLocation()
    expect(result?.utm_medium).toBe('social')
  })

  it('detects subdomain as internal referrer', () => {
    setLocation('https://planetmotors.ca/', 'https://blog.planetmotors.ca/article')
    const result = buildAttributionFromLocation()
    expect(result).toBeNull()
  })
})

describe('persistAttribution / readStoredAttribution', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('persists and reads attribution from sessionStorage', () => {
    const attr: AttributionPayload = { utm_source: 'google', utm_medium: 'cpc', captured_at: '2026-01-01T00:00:00Z' }
    persistAttribution(attr, 'sessionStorage')
    const stored = readStoredAttribution('sessionStorage')
    expect(stored?.first_touch?.utm_source).toBe('google')
    expect(stored?.last_touch?.utm_source).toBe('google')
  })

  it('preserves first_touch on subsequent persist', () => {
    const first: AttributionPayload = { utm_source: 'google', utm_medium: 'cpc', captured_at: '2026-01-01T00:00:00Z' }
    const second: AttributionPayload = { utm_source: 'facebook', utm_medium: 'social', captured_at: '2026-01-02T00:00:00Z' }
    persistAttribution(first, 'sessionStorage')
    persistAttribution(second, 'sessionStorage')
    const stored = readStoredAttribution('sessionStorage')
    expect(stored?.first_touch?.utm_source).toBe('google')
    expect(stored?.last_touch?.utm_source).toBe('facebook')
  })

  it('returns null when nothing stored', () => {
    expect(readStoredAttribution('sessionStorage')).toBeNull()
  })
})

describe('captureAttributionFromUrl', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('captures and persists on first visit with UTM', () => {
    setLocation('https://planetmotors.ca/?utm_source=google&utm_campaign=spring', '')
    captureAttributionFromUrl()
    const stored = readStoredAttribution('sessionStorage')
    expect(stored?.first_touch?.utm_source).toBe('google')
  })

  it('does not overwrite last_touch on SPA navigation without new campaign', () => {
    const first: AttributionPayload = {
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'spring',
      gclid: 'abc', captured_at: '2026-01-01T00:00:00Z',
    }
    persistAttribution(first, 'sessionStorage')

    setLocation('https://planetmotors.ca/inventory', 'https://planetmotors.ca/')
    captureAttributionFromUrl()
    const stored = readStoredAttribution('sessionStorage')
    expect(stored?.last_touch?.gclid).toBe('abc')
    expect(stored?.last_touch?.utm_campaign).toBe('spring')
  })

  it('overwrites last_touch when new campaign arrives', () => {
    const first: AttributionPayload = {
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'spring',
      captured_at: '2026-01-01T00:00:00Z',
    }
    persistAttribution(first, 'sessionStorage')

    setLocation('https://planetmotors.ca/?utm_source=facebook&utm_campaign=summer&fbclid=fb123', '')
    captureAttributionFromUrl()
    const stored = readStoredAttribution('sessionStorage')
    expect(stored?.first_touch?.utm_source).toBe('google')
    expect(stored?.last_touch?.utm_source).toBe('facebook')
    expect(stored?.last_touch?.fbclid).toBe('fb123')
  })
})

describe('getAttributionForEvent', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('returns empty object when no attribution stored', () => {
    expect(getAttributionForEvent()).toEqual({})
  })

  it('returns last-touch attribution fields', () => {
    const attr: AttributionPayload = {
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'test',
      gclid: 'abc', captured_at: '2026-01-01T00:00:00Z',
    }
    persistAttribution(attr, 'sessionStorage')
    const result = getAttributionForEvent()
    expect(result.utm_source).toBe('google')
    expect(result.utm_medium).toBe('cpc')
    expect(result.gclid).toBe('abc')
    expect(result.first_touch).toBeDefined()
    expect(result.last_touch).toBeDefined()
  })
})
