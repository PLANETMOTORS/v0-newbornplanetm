/**
 * Coverage follow-up for PR #506
 * Covers 7 files flagged by Sonar with uncovered new lines.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('resend', () => {
  class ResendMock {
    emails = { send: vi.fn().mockResolvedValue({ data: { id: 'ok' }, error: null }) }
    constructor(_key: string) {}
  }
  return { Resend: ResendMock }
})
vi.mock('@/lib/email', () => ({ escapeHtml: (s: string) => s }))
vi.mock('@/lib/constants/dealership', () => ({
  DEALERSHIP_LOCATION: { streetAddress: '30 Major Mackenzie E', city: 'Richmond Hill', province: 'ON', postalCode: 'L4C 1G7' },
  PHONE_LOCAL: '905-737-3334', PHONE_TOLL_FREE: '1-866-787-3332',
}))
vi.mock('@/lib/meta-capi', () => ({ sendMetaEvent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('lucide-react', () => ({
  Bot: 'Bot', Car: 'Car', CalendarCheck: 'CalendarCheck',
  Clock: 'Clock', DollarSign: 'DollarSign', MessageSquare: 'MessageSquare',
}))

// ── lib/csrf.ts ───────────────────────────────────────────────────────────────
describe('csrf validateOrigin', () => {
  beforeEach(() => { vi.unstubAllEnvs() })

  it('returns true in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { validateOrigin } = await import('@/lib/csrf')
    expect(validateOrigin(new Request('http://x.com', { headers: { origin: 'http://evil.com' } }))).toBe(true)
  })
  it('returns false with no origin/referer in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://planetmotors.ca')
    const { validateOrigin } = await import('@/lib/csrf')
    expect(validateOrigin(new Request('https://planetmotors.ca/api/x'))).toBe(false)
  })
  it('accepts matching Origin in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://planetmotors.ca')
    vi.stubEnv('NEXT_PUBLIC_SITE_DOMAIN', 'planetmotors.ca')
    const { validateOrigin } = await import('@/lib/csrf')
    expect(validateOrigin(new Request('https://planetmotors.ca/api/x', { headers: { origin: 'https://planetmotors.ca' } }))).toBe(true)
  })
  it('falls back to Referer header', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://planetmotors.ca')
    const { validateOrigin } = await import('@/lib/csrf')
    expect(validateOrigin(new Request('https://planetmotors.ca/api/x', { headers: { referer: 'https://planetmotors.ca/p' } }))).toBe(true)
  })
  it('allows localhost in non-production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '')
    const { validateOrigin } = await import('@/lib/csrf')
    expect(validateOrigin(new Request('http://localhost:3000', { headers: { origin: 'http://localhost:3000' } }))).toBe(true)
  })
})

// ── lib/email/lead-notifier.ts ────────────────────────────────────────────────
describe('lead-notifier notifyLead', () => {
  it('succeeds with Resend key set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({
      source: 'vdp_inquiry', firstName: 'John', lastName: 'Smith', email: 'j@s.ca',
      vehicle: { id: 'v1', year: 2023, make: 'Tesla', model: 'Model 3', price: 49900 },
    })
    expect(res.internalEmail.success).toBe(true)
    expect(res.customerEmail.success).toBe(true)
  })
  it('notifyAgentOnly returns success', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test_key')
    const { notifyAgentOnly } = await import('@/lib/email/lead-notifier')
    const res = await notifyAgentOnly({ source: 'trade_in', firstName: 'A', lastName: 'B', email: 'a@b.ca' })
    expect(res.success).toBe(true)
  })
  it('returns errors when key missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('API_KEY_RESEND', '')
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({ source: 'contact_form', firstName: 'J', lastName: 'D', email: 'j@d.com' })
    expect(res.internalEmail.success).toBe(false)
    expect(res.internalEmail.error).toMatch(/Resend not configured/)
  })
})

// ── lib/admin/lead-utils.ts ───────────────────────────────────────────────────
describe('admin/lead-utils timeAgo', () => {
  it('just now', async () => {
    const { timeAgo } = await import('@/lib/admin/lead-utils')
    expect(timeAgo(new Date().toISOString())).toBe('just now')
  })
  it('minutes ago', async () => {
    const { timeAgo } = await import('@/lib/admin/lead-utils')
    expect(timeAgo(new Date(Date.now() - 5 * 60000).toISOString())).toBe('5m ago')
  })
  it('hours ago', async () => {
    const { timeAgo } = await import('@/lib/admin/lead-utils')
    expect(timeAgo(new Date(Date.now() - 3 * 3600000).toISOString())).toBe('3h ago')
  })
  it('days ago', async () => {
    const { timeAgo } = await import('@/lib/admin/lead-utils')
    expect(timeAgo(new Date(Date.now() - 2 * 86400000).toISOString())).toBe('2d ago')
  })
})
describe('admin/lead-utils sourceIcon', () => {
  it('covers all cases', async () => {
    const { sourceIcon } = await import('@/lib/admin/lead-utils')
    for (const s of ['contact_form','chat','finance_app','reservation','trade_in','test_drive','other'])
      expect(sourceIcon(s)).toBeDefined()
  })
})
describe('admin/lead-utils leadStatusVariant', () => {
  it('all statuses', async () => {
    const { leadStatusVariant } = await import('@/lib/admin/lead-utils')
    expect(leadStatusVariant('new')).toBe('default')
    expect(leadStatusVariant('contacted')).toBe('secondary')
    expect(leadStatusVariant('qualified')).toBe('outline')
    expect(leadStatusVariant('converted')).toBe('default')
    expect(leadStatusVariant('lost')).toBe('destructive')
    expect(leadStatusVariant('unknown')).toBe('secondary')
  })
})

// ── lib/meta-capi-helpers.ts ──────────────────────────────────────────────────
describe('meta-capi-helpers extractRequestContext', () => {
  it('extracts all fields', async () => {
    const { extractRequestContext } = await import('@/lib/meta-capi-helpers')
    const ctx = extractRequestContext(new Request('https://x.com/', { headers: {
      'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'Mozilla',
      'referer': 'https://planetmotors.ca/', 'cookie': '_fbc=fb.1.1; _fbp=fb.2.2',
    }}))
    expect(ctx.clientIp).toBe('1.2.3.4')
    expect(ctx.fbc).toBe('fb.1.1')
    expect(ctx.fbp).toBe('fb.2.2')
  })
  it('handles missing headers', async () => {
    const { extractRequestContext } = await import('@/lib/meta-capi-helpers')
    const ctx = extractRequestContext(new Request('https://x.com/'))
    expect(ctx.clientIp).toBeUndefined()
    expect(ctx.fbc).toBeUndefined()
  })
})
describe('meta-capi-helpers event helpers', () => {
  it('all four helpers do not throw', async () => {
    const { trackLead, trackViewContent, trackInitiateCheckout, trackSchedule } = await import('@/lib/meta-capi-helpers')
    const r = new Request('https://x.com/')
    expect(() => trackLead(r, { email: 'a@b.com' })).not.toThrow()
    expect(() => trackViewContent(r, { contentName: 'Tesla Model 3' })).not.toThrow()
    expect(() => trackInitiateCheckout(r, { value: 55000 })).not.toThrow()
    expect(() => trackSchedule(r, { email: 'a@b.com' })).not.toThrow()
  })
})

// ── lib/homenet/parser.ts ─────────────────────────────────────────────────────
describe('homenet parseHomenetXML', () => {
  it('returns [] for empty XML', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    expect(parseHomenetXML('')).toEqual([])
    expect(parseHomenetXML('<root></root>')).toEqual([])
  })
  it('parses a minimal valid vehicle', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    const r = parseHomenetXML('<vehicle><vin>1HGCM82633A004352</vin><stocknumber>PM1</stocknumber><year>2023</year><make>Honda</make><model>Accord</model><price>29900</price><mileage>15000</mileage></vehicle>')
    expect(r).toHaveLength(1)
    expect(r[0].vin).toBe('1HGCM82633A004352')
    expect(r[0].make).toBe('Honda')
  })
  it('skips invalid VIN', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    expect(parseHomenetXML('<vehicle><vin>SHORT</vin><stocknumber>X</stocknumber></vehicle>')).toHaveLength(0)
  })
  it('skips missing stock number', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    expect(parseHomenetXML('<vehicle><vin>1HGCM82633A004352</vin></vehicle>')).toHaveLength(0)
  })
  it('sets is_ev for electric fueltype', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    const r = parseHomenetXML('<vehicle><vin>5YJ3E1EA7KF328931</vin><stocknumber>EV1</stocknumber><year>2022</year><make>Tesla</make><model>Model3</model><price>49900</price><mileage>20000</mileage><fueltype>Electric</fueltype></vehicle>')
    expect(r[0].is_ev).toBe(true)
  })
  it('parses photo URLs', async () => {
    const { parseHomenetXML } = await import('@/lib/homenet/parser')
    const r = parseHomenetXML('<vehicle><vin>1HGCM82633A004352</vin><stocknumber>IMG1</stocknumber><year>2021</year><make>Toyota</make><model>Camry</model><price>25000</price><mileage>30000</mileage><photo>https://photos.homenetiol.com/img1.jpg</photo><photo>https://photos.homenetiol.com/img2.jpg</photo></vehicle>')
    expect(r[0].image_urls).toHaveLength(2)
    expect(r[0].primary_image_url).toBe('https://photos.homenetiol.com/img1.jpg')
  })
})

// ── lib/validation.ts ─────────────────────────────────────────────────────────
describe('validation isValidMileage', () => {
  it('accepts valid values', async () => {
    const { isValidMileage } = await import('@/lib/validation')
    expect(isValidMileage(0)).toBe(true)
    expect(isValidMileage(50000)).toBe(true)
    expect(isValidMileage('75,000')).toBe(true)
    expect(isValidMileage(1000000)).toBe(true)
  })
  it('rejects invalid', async () => {
    const { isValidMileage } = await import('@/lib/validation')
    expect(isValidMileage(-1)).toBe(false)
    expect(isValidMileage(1000001)).toBe(false)
    expect(isValidMileage('abc')).toBe(false)
  })
})
describe('validation formatMileage', () => {
  it('formats number', async () => {
    const { formatMileage } = await import('@/lib/validation')
    expect(formatMileage(75000)).toMatch(/75/)
  })
  it('returns 0 for NaN', async () => {
    const { formatMileage } = await import('@/lib/validation')
    expect(formatMileage('abc')).toBe('0')
  })
})
describe('validation validateForm', () => {
  it('passes valid data', async () => {
    const { validateForm } = await import('@/lib/validation')
    expect(validateForm({ n: 'Alice' }, { n: { required: true, minLength: 2 } }).isValid).toBe(true)
  })
  it('fails required', async () => {
    const { validateForm } = await import('@/lib/validation')
    const r = validateForm({ n: '' }, { n: { required: true, message: 'Req' } })
    expect(r.isValid).toBe(false)
    expect(r.errors.n).toBe('Req')
  })
  it('fails minLength', async () => {
    const { validateForm } = await import('@/lib/validation')
    expect(validateForm({ n: 'A' }, { n: { minLength: 2 } }).isValid).toBe(false)
  })
  it('fails maxLength', async () => {
    const { validateForm } = await import('@/lib/validation')
    expect(validateForm({ n: 'A'.repeat(101) }, { n: { maxLength: 100 } }).isValid).toBe(false)
  })
  it('fails pattern', async () => {
    const { validateForm } = await import('@/lib/validation')
    expect(validateForm({ n: 'bad' }, { n: { pattern: /^d+$/ } }).isValid).toBe(false)
  })
  it('fails custom validator', async () => {
    const { validateForm } = await import('@/lib/validation')
    const r = validateForm({ c: 'BAD' }, { c: { custom: (v) => v === 'GOOD', message: 'Must be GOOD' } })
    expect(r.errors.c).toBe('Must be GOOD')
  })
})
describe('validation validateTradeInForm', () => {
  it('passes complete form', async () => {
    const { validateTradeInForm } = await import('@/lib/validation')
    expect(validateTradeInForm({ firstName: 'John', lastName: 'Smith', email: 'john@planetmotors.ca', phone: '4165551234', postalCode: 'M5V 3A1' }).valid).toBe(true)
  })
  it('passes with combined name', async () => {
    const { validateTradeInForm } = await import('@/lib/validation')
    expect(validateTradeInForm({ name: 'Jane Doe', email: 'jane@planetmotors.ca', phone: '4165551234', postalCode: 'M5V 3A1' }).valid).toBe(true)
  })
  it('returns errors for invalid fields', async () => {
    const { validateTradeInForm } = await import('@/lib/validation')
    const r = validateTradeInForm({ email: 'bad', phone: '0000000000', postalCode: 'Z9Z' })
    expect(r.valid).toBe(false)
    expect(r.errors.email).toBeDefined()
    expect(r.errors.phone).toBeDefined()
    expect(r.errors.postalCode).toBeDefined()
  })
})

// ── lib/vehicle-images.ts ─────────────────────────────────────────────────────
describe('vehicle-images', () => {
  it('extractListingId returns ID or null', async () => {
    const { extractListingId } = await import('@/lib/vehicle-images')
    expect(extractListingId('https://planetmotors.ca/inventory/x/13287755/')).toBe('13287755')
    expect(extractListingId('no-match')).toBeNull()
  })
  it('constructImageUrls returns correct count', async () => {
    const { constructImageUrls } = await import('@/lib/vehicle-images')
    const urls = constructImageUrls('13287755', 5)
    expect(urls).toHaveLength(5)
    expect(urls[0]).toContain('13287755')
  })
  it('getMakePlaceholder always null', async () => {
    const { getMakePlaceholder } = await import('@/lib/vehicle-images')
    expect(getMakePlaceholder('Tesla')).toBeNull()
  })
  it('isValidImageUrl accepts CDN, rejects unsplash/inventory', async () => {
    const { isValidImageUrl } = await import('@/lib/vehicle-images')
    expect(isValidImageUrl('https://cdn.planetmotors.ca/img.webp')).toBe(true)
    expect(isValidImageUrl('https://images.unsplash.com/x')).toBe(false)
    expect(isValidImageUrl('https://www.planetmotors.ca/inventory/x')).toBe(false)
    expect(isValidImageUrl(null)).toBe(false)
    expect(isValidImageUrl(undefined)).toBe(false)
  })
  it('getVehicleImage returns best image or null', async () => {
    const { getVehicleImage } = await import('@/lib/vehicle-images')
    expect(getVehicleImage({ primary_image_url: 'https://cdn.planetmotors.ca/car.jpg', make: 'Tesla' })).toBe('https://cdn.planetmotors.ca/car.jpg')
    expect(getVehicleImage({ primary_image_url: null, image_urls: ['https://cdn.planetmotors.ca/c2.jpg'], make: 'Honda' })).toBe('https://cdn.planetmotors.ca/c2.jpg')
    expect(getVehicleImage({ primary_image_url: null, image_urls: [], make: 'Ford' })).toBeNull()
  })
})
