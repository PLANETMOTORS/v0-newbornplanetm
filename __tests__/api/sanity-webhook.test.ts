import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────
const revalidatePath = vi.fn()
const revalidateTag  = vi.fn()

class MockNextRequest {
  private _body: string
  private _headers: Map<string, string>
  constructor(body: string, headers: Record<string, string> = {}) {
    this._body = body
    this._headers = new Map(Object.entries(headers))
  }
  async text() { return this._body }
  get headers() {
    return { get: (k: string) => this._headers.get(k) ?? null }
  }
}

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))
vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ status: init?.status ?? 200, body }),
  },
}))
vi.mock('node:crypto', () => ({
  default: {
    createHmac: () => ({ update: () => ({ digest: () => 'aabbccdd' }) }),
    timingSafeEqual: (a: Buffer, b: Buffer) => a.toString() === b.toString(),
  },
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('@/lib/typesense/sync', () => ({
  syncVehicleToTypesense: vi.fn().mockResolvedValue({ success: true, action: 'upsert' }),
}))

const { POST } = await import('@/app/api/webhooks/sanity/route')

// ── Helper ──────────────────────────────────────────────────────────────────
function makeReq(payload: object, sig = 'aabbccdd') {
  return new MockNextRequest(JSON.stringify(payload), { 'sanity-webhook-signature': sig })
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('POST /api/webhooks/sanity', () => {
  beforeEach(() => {
    revalidatePath.mockReset()
    revalidateTag.mockReset()
    process.env.SANITY_WEBHOOK_SECRET = 'test-secret'
  })

  it('returns 500 when SANITY_WEBHOOK_SECRET is not set', async () => {
    delete process.env.SANITY_WEBHOOK_SECRET
    const req = new MockNextRequest(JSON.stringify({ _type: 'vehicle' }), { 'sanity-webhook-signature': 'x' })
    // @ts-expect-error minimal mock
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 401 when signature header is missing', async () => {
    const req = new MockNextRequest(JSON.stringify({ _type: 'blogPost' }), {})
    // @ts-expect-error minimal mock
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('revalidates / and /inventory for any document type', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'vehicle', _id: 'v1', operation: 'update' }))
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/inventory')
  })

  it('revalidates /blog page for blogPost documents', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'blogPost', _id: 'bp1' }))
    expect(revalidatePath).toHaveBeenCalledWith('/blog', 'page')
  })

  it('revalidates /faq page for faqItem documents', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'faqItem', _id: 'f1' }))
    expect(revalidatePath).toHaveBeenCalledWith('/faq', 'page')
  })

  it('revalidates /faq page for faqEntry documents', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'faqEntry', _id: 'f2' }))
    expect(revalidatePath).toHaveBeenCalledWith('/faq', 'page')
  })

  it('revalidates /protection-plans for protectionPlan', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'protectionPlan', _id: 'pp1' }))
    expect(revalidatePath).toHaveBeenCalledWith('/protection-plans', 'page')
  })

  it('revalidates /about for testimonial documents', async () => {
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'testimonial', _id: 't1' }))
    expect(revalidatePath).toHaveBeenCalledWith('/about', 'page')
  })

  it('calls syncVehicleToTypesense for vehicle documents', async () => {
    const { syncVehicleToTypesense } = await import('@/lib/typesense/sync')
    // @ts-expect-error minimal mock
    const res = await POST(makeReq({ _type: 'vehicle', _id: 'veh-1', operation: 'create' }))
    expect(syncVehicleToTypesense).toHaveBeenCalledWith('veh-1', 'create')
    expect(res.body.typesense.action).toBe('upsert')
  })

  it('does not call syncVehicleToTypesense for non-vehicle documents', async () => {
    const { syncVehicleToTypesense } = await import('@/lib/typesense/sync')
    // @ts-expect-error minimal mock
    await POST(makeReq({ _type: 'blogPost', _id: 'bp2' }))
    expect(syncVehicleToTypesense).not.toHaveBeenCalled()
  })

  it('returns 200 success response with all expected fields', async () => {
    // @ts-expect-error minimal mock
    const res = await POST(makeReq({ _type: 'homepage', _id: 'hp1', operation: 'update' }))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, documentType: 'homepage', documentId: 'hp1' })
  })
})
