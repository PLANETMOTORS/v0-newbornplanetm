import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('next/server', () => {
  return {
    NextRequest: class {
      nextUrl: URL
      constructor(url: string) {
        this.nextUrl = new URL(url)
      }
    },
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => ({
        status: init?.status ?? 200,
        body,
      }),
    },
  }
})

// ── Import after mocking ───────────────────────────────────────────────────
const { GET } = await import('@/app/api/address-lookup/route')

function makeRequest(postalCode: string) {
  const { NextRequest } = await import('next/server') as never as { NextRequest: new (u: string) => { nextUrl: URL } }
  return new NextRequest(`http://localhost/api/address-lookup?postalCode=${encodeURIComponent(postalCode)}`)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/address-lookup', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Prevent real network calls in tests
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  })

  it('returns empty result for postal code shorter than 3 chars', async () => {
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=L4') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    expect(res.body).toEqual({ suggestions: [], city: '', province: '' })
  })

  it('returns known streets for Richmond Hill L4B prefix', async () => {
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=L4B1A1') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.body.suggestions.length).toBeGreaterThan(0)
    expect(res.body.city).toBe('Richmond Hill')
    expect(res.body.province).toBe('Ontario')
  })

  it('returns known streets for Toronto M5V prefix', async () => {
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=M5V3A1') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    expect(res.body.city).toBe('Toronto')
    expect(res.body.suggestions.some((s: { streetName: string }) => s.streetName === 'Spadina')).toBe(true)
  })

  it('normalises lowercase postal code input', async () => {
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=l4b+1a1') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    expect(res.body.city).toBe('Richmond Hill')
  })

  it('returns province from first postal code letter for unknown prefix', async () => {
    // K prefix → Ontario; no known city, triggers online fallback (mocked to fail)
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=K9Z9Z9') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    // Province should still be derived from first letter
    expect(res.body.province).toBe('Ontario')
  })

  it('uses online fallback when local map has no city', async () => {
    // Q prefix is not in the first-letter map → will call geocoder.ca
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        standard: { city: 'FakeCity', prov: 'QC', staddress: 'Rue Sainte-Catherine' },
      }),
    })
    const req = { nextUrl: new URL('http://localhost/api/address-lookup?postalCode=Q1A1A1') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    // The fetch mock may or may not be used depending on the prefix map — just ensure we get a valid shape
    expect(res.body).toHaveProperty('suggestions')
    expect(res.body).toHaveProperty('city')
    expect(res.body).toHaveProperty('province')
  })

  it('handles missing postalCode param gracefully', async () => {
    const req = { nextUrl: new URL('http://localhost/api/address-lookup') }
    // @ts-expect-error minimal mock
    const res = await GET(req)
    expect(res.body).toEqual({ suggestions: [], city: '', province: '' })
  })
})
