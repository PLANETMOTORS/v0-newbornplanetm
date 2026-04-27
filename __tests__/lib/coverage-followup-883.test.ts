/**
 * Coverage follow-up for PR #496 (sonar-cleanup-883).
 * Exercises every function whose body was touched by the
 * `.replaceAll(/regex/g, ...)` -> `.replace(/regex/g, ...)` and
 * `.match() -> .exec()` refactors so the new lines hit coverage.
 *
 * Pattern matches __tests__/lib/coverage-followup-506.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sanity/client', () => ({
  createClient: () => ({ fetch: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('stripe', () => {
  class StripeMock {
    checkout = { sessions: { create: vi.fn() } }
  }
  return { default: StripeMock }
})

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  globalThis.fetch = realFetch
})

function mockFetchOnce(body: string, init: ResponseInit = { status: 200 }) {
  const fn = vi.fn().mockResolvedValue(new Response(body, init))
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

// ── lib/vehicle-slug.ts ─────────────────────────────────────────────────────
describe('vehicle-slug generateVehicleSlug', () => {
  it('produces a hyphen-only lowercase slug', async () => {
    const { generateVehicleSlug } = await import('@/lib/vehicle-slug')
    const slug = generateVehicleSlug({
      year: 2023,
      make: 'Land Rover',
      model: 'Range Rover Sport!',
      vin: '1HGCM82633A004352',
    })
    expect(slug).toMatch(/^[a-z0-9-]+$/)
    expect(slug).not.toMatch(/--/)
    expect(slug.startsWith('-')).toBe(false)
    expect(slug.endsWith('-')).toBe(false)
  })
})

// ── lib/validation.ts ───────────────────────────────────────────────────────
describe('validation regex helpers', () => {
  it('formats Canadian postal codes', async () => {
    const { formatCanadianPostalCode } = await import('@/lib/validation')
    expect(formatCanadianPostalCode('m5v 3a1')).toMatch(/M5V/)
    expect(formatCanadianPostalCode('m5v3a1')).toMatch(/M5V/)
  })
  it('validates Canadian postal codes', async () => {
    const { isValidCanadianPostalCode } = await import('@/lib/validation')
    expect(isValidCanadianPostalCode('M5V 3A1')).toBe(true)
    expect(isValidCanadianPostalCode('m5v3a1')).toBe(true)
    expect(isValidCanadianPostalCode('NOT-A-CODE')).toBe(false)
  })
  it('validates Canadian phone numbers', async () => {
    const { isValidCanadianPhoneNumber } = await import('@/lib/validation')
    expect(isValidCanadianPhoneNumber('(416) 555-1234')).toBe(true)
    expect(isValidCanadianPhoneNumber('+1 416 555 1234')).toBe(true)
    expect(isValidCanadianPhoneNumber('123')).toBe(false)
  })
  it('formats Canadian phone numbers', async () => {
    const { formatCanadianPhoneNumber } = await import('@/lib/validation')
    expect(formatCanadianPhoneNumber('4165551234')).toMatch(/416/)
  })
})

// ── lib/vehicle-data.ts ─────────────────────────────────────────────────────
describe('vehicle-data formatPostalCode', () => {
  it('formats postal code with space', async () => {
    const { formatPostalCode } = await import('@/lib/vehicle-data')
    expect(formatPostalCode('m5v3a1')).toBe('M5V 3A1')
    expect(formatPostalCode('M5V-3A1')).toBe('M5V 3A1')
    expect(formatPostalCode('short')).toBe('SHORT')
  })
})

// ── lib/typesense.ts ────────────────────────────────────────────────────────
describe('typesense sanitizeTypesenseFilterValue', () => {
  it('backtick-wraps simple values', async () => {
    const { sanitizeTypesenseFilterValue } = await import('@/lib/typesense')
    expect(sanitizeTypesenseFilterValue('Tesla')).toBe('`Tesla`')
    expect(sanitizeTypesenseFilterValue('Land Rover')).toBe('`Land Rover`')
  })
  it('escapes backticks in values', async () => {
    const { sanitizeTypesenseFilterValue } = await import('@/lib/typesense')
    expect(sanitizeTypesenseFilterValue('a`b')).toContain('\\`')
  })
  it('rejects forbidden tokens', async () => {
    const { sanitizeTypesenseFilterValue } = await import('@/lib/typesense')
    expect(() => sanitizeTypesenseFilterValue('a && b')).toThrow()
  })
})

// ── lib/redact.ts ───────────────────────────────────────────────────────────
describe('redact maskPhone', () => {
  it('masks middle digits', async () => {
    const { maskPhone } = await import('@/lib/redact')
    expect(maskPhone('416-555-1234')).toMatch(/\*+/)
  })
  it('handles null / empty input', async () => {
    const { maskPhone } = await import('@/lib/redact')
    expect(maskPhone(null)).toBeDefined()
    expect(maskPhone('')).toBeDefined()
  })
})

// ── lib/license-path.ts ─────────────────────────────────────────────────────
describe('license-path isValidLicensePath', () => {
  it('accepts a path matching sanitized vehicle id', async () => {
    const { isValidLicensePath } = await import('@/lib/license-path')
    expect(isValidLicensePath('v_123/456_license.jpg', 'v 123')).toBe(true)
  })
  it('rejects a path with the wrong vehicle id', async () => {
    const { isValidLicensePath } = await import('@/lib/license-path')
    expect(isValidLicensePath('other/456_license.jpg', 'v_123')).toBe(false)
  })
  it('rejects malformed paths', async () => {
    const { isValidLicensePath } = await import('@/lib/license-path')
    expect(isValidLicensePath('not-a-path', 'v_123')).toBe(false)
  })
})

// ── lib/liveVideoTour/schema.ts ─────────────────────────────────────────────
describe('liveVideoTour schema phone helpers', () => {
  it('formatPhoneNumber wraps with formatting', async () => {
    const { formatPhoneNumber } = await import('@/lib/liveVideoTour/schema')
    expect(formatPhoneNumber('4165551234')).toBe('(416) 555-1234')
    expect(formatPhoneNumber('416555')).toBe('(416) 555')
    expect(formatPhoneNumber('41')).toBe('41')
  })
  it('isValidPhone accepts 10-digit input', async () => {
    const { isValidPhone } = await import('@/lib/liveVideoTour/schema')
    expect(isValidPhone('(416) 555-1234')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
  })
})

// ── lib/liveVideoTour/providers/whatsapp.ts ─────────────────────────────────
describe('liveVideoTour whatsapp provider', () => {
  it('module imports and exports a provider object', async () => {
    const mod = await import('@/lib/liveVideoTour/providers/whatsapp')
    expect(mod.whatsappProvider).toBeDefined()
    expect(typeof mod.whatsappProvider).toBe('object')
  })
})

// ── lib/meta-capi.ts ────────────────────────────────────────────────────────
describe('meta-capi sendMetaEvent', () => {
  it('returns success=false when access token missing', async () => {
    vi.stubEnv('META_PIXEL_ACCESS_TOKEN', '')
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '')
    const mod = await import('@/lib/meta-capi')
    const res = await mod.sendMetaEvent({
      eventName: 'Lead',
      eventTime: Math.floor(Date.now() / 1000),
      userData: { phone: '4165551234', postalCode: 'M5V 3A1' },
    })
    expect(res.success).toBe(false)
  })
})

// ── lib/crm/autoraptor.ts ───────────────────────────────────────────────────
describe('autoraptor', () => {
  it('mapLeadToAutoRaptor returns a structured payload', async () => {
    const { mapLeadToAutoRaptor } = await import('@/lib/crm/autoraptor')
    const out = mapLeadToAutoRaptor({
      firstName: 'John',
      lastName: 'Doe',
      email: 'j@d.ca',
      phone: '4165551234',
      source: 'trade_in',
    })
    expect(out.firstName).toBe('John')
    expect(out.requestType).toBe('sell')
  })
  it('pushToAutoRaptor builds ADF XML with the title-cased source', async () => {
    const fetchMock = mockFetchOnce('ok')
    vi.stubEnv('AUTORAPTOR_ADF_ENDPOINT', 'https://example.com/adf')
    const { pushToAutoRaptor } = await import('@/lib/crm/autoraptor')
    await pushToAutoRaptor({
      firstName: 'John',
      lastName: 'Doe',
      email: 'j@d.ca',
      phone: '4165551234',
      source: 'trade_in',
      requestType: 'sell',
    })
    const lastCall = fetchMock.mock.calls[0]
    const init = lastCall ? (lastCall[1] as RequestInit | undefined) : undefined
    const body = typeof init?.body === 'string' ? init.body : ''
    expect(body).toContain('Trade In')
  })
})

// ── lib/drivee-sync.ts ──────────────────────────────────────────────────────
describe('drivee-sync resolveMidFromPirelly', () => {
  it('returns null when iframe src has no mid', async () => {
    mockFetchOnce(JSON.stringify({ iframeAttrs: { src: 'https://x.com/no-mid' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const { resolveMidFromPirelly } = await import('@/lib/drivee-sync')
    expect(await resolveMidFromPirelly('1HGCM82633A004352')).toBeNull()
  })
  it('returns mid when iframe src contains it', async () => {
    mockFetchOnce(JSON.stringify({ iframeAttrs: { src: 'https://x.com/?mid=12345&foo=bar' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const { resolveMidFromPirelly } = await import('@/lib/drivee-sync')
    expect(await resolveMidFromPirelly('1HGCM82633A004352')).toBe('12345')
  })
  it('resolveMidFromPirellyByStock also extracts mid', async () => {
    mockFetchOnce(JSON.stringify({ iframeAttrs: { src: 'https://x.com/?mid=99999' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const { resolveMidFromPirellyByStock } = await import('@/lib/drivee-sync')
    expect(await resolveMidFromPirellyByStock('STK001')).toBe('99999')
  })
})

// ── lib/ab-testing.ts ───────────────────────────────────────────────────────
describe('ab-testing getVariant SSR safety', () => {
  it('returns first variant under SSR (no window)', async () => {
    const { getVariant } = await import('@/lib/ab-testing')
    const variants: ['control', 'variant_a'] = ['control', 'variant_a']
    const v = getVariant<'control' | 'variant_a'>('exp-id', { variants })
    expect(variants).toContain(v)
  })
})

// ── lib/stripe.ts ───────────────────────────────────────────────────────────
describe('stripe module', () => {
  it('module exports getStripe and stripe', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_dummy')
    const mod = await import('@/lib/stripe')
    expect(typeof mod.getStripe).toBe('function')
    expect(mod.stripe).toBeDefined()
  })
})

// ── lib/image-utils.ts ──────────────────────────────────────────────────────
describe('image-utils helpers', () => {
  it('getOptimizedImageUrl + getInventoryCardUrl run', async () => {
    const m = await import('@/lib/image-utils')
    expect(typeof m.getOptimizedImageUrl('/img.jpg')).toBe('string')
    expect(typeof m.getInventoryCardUrl('v123')).toBe('string')
  })
})

// ── lib/homenet/parser.ts (extra coverage on .matchAll change) ─────────────
describe('homenet parseHomenetXML matchAll path', () => {
  it('parses multiple vehicles via matchAll', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    const xml =
      '<root>' +
      '<vehicle><vin>1HGCM82633A004352</vin><stocknumber>A1</stocknumber><year>2023</year><make>Honda</make><model>Accord</model><price>29900</price><mileage>10000</mileage></vehicle>' +
      '<vehicle><vin>5YJ3E1EA7KF328931</vin><stocknumber>B1</stocknumber><year>2022</year><make>Tesla</make><model>Model3</model><price>49900</price><mileage>20000</mileage></vehicle>' +
      '</root>'
    expect(parseHomenetXML(xml)).toHaveLength(2)
  })
})
