import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ────────────────────────────────────────────────────────────────────────────
// Supabase client mock factory
// Returns a chainable proxy that resolves to the given queryResult.
// Supports: .from().select/upsert/delete().eq().order().single()
// ────────────────────────────────────────────────────────────────────────────
function createMockSupabaseClient(
  getUserResult: { data: { user: { id: string; email?: string } | null }; error: unknown } = {
    data: { user: { id: 'user-123', email: 'user@example.com' } },
    error: null,
  },
  queryResult: { data?: unknown; error?: unknown } = { data: null, error: null },
) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(queryResult)
      }
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  const proxyBuilder = () => new Proxy({}, handler)

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(getUserResult),
    },
    from: vi.fn().mockImplementation(() => proxyBuilder()),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Module mocks — must be defined before importing the route
// ────────────────────────────────────────────────────────────────────────────
let mockCreateClient = vi.fn()
let mockValidateOrigin = vi.fn().mockReturnValue(true)

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/csrf', () => ({
  validateOrigin: (...args: unknown[]) => mockValidateOrigin(...args),
}))

const { GET, PUT, DELETE } = await import('@/app/api/v1/financing/drafts/route')

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function makeGetRequest(url = 'http://localhost:3000/api/v1/financing/drafts') {
  return new NextRequest(url, { method: 'GET' })
}

function makePutRequest(body: unknown, url = 'http://localhost:3000/api/v1/financing/drafts') {
  return new NextRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(url: string) {
  return new NextRequest(url, {
    method: 'DELETE',
    headers: { origin: 'http://localhost:3000' },
  })
}

const authedUser = { id: 'user-abc', email: 'user@example.com' }
const authedGetUserResult = { data: { user: authedUser }, error: null }
const unauthGetUserResult = { data: { user: null }, error: new Error('Unauthenticated') }
const noUserGetUserResult = { data: { user: null }, error: null }

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/financing/drafts
// ────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/financing/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
  })

  it('returns 401 when user is not authenticated (error)', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(unauthGetUserResult))
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 when user is null without an auth error', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(noUserGetUserResult))
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns 200 with empty array when no drafts exist', async () => {
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: [], error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('returns 200 with drafts array on success', async () => {
    const drafts = [
      { id: 'draft-1', vehicle_id: 'veh-1', form_data: { currentStep: 2 }, updated_at: '2024-01-01T00:00:00Z' },
    ]
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: drafts, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(drafts)
  })

  it('returns 500 when the DB query returns an error', async () => {
    // We need a supabase where the chainable query eventually resolves with error
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: 'DB error' } })
        }
        return (..._args: unknown[]) => new Proxy({}, handler)
      },
    }
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue(authedGetUserResult) },
      from: vi.fn().mockImplementation(() => new Proxy({}, handler)),
    }
    mockCreateClient.mockResolvedValue(supabase)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns empty array when data is null (treats null as empty)', async () => {
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: null, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })
})

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/financing/drafts
// ────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/financing/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
  })

  it('returns 403 when origin validation fails', async () => {
    mockValidateOrigin.mockReturnValue(false)
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(authedGetUserResult))
    const res = await PUT(makePutRequest({ formData: { currentStep: 1 } }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('returns 401 when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(unauthGetUserResult))
    const res = await PUT(makePutRequest({ formData: { currentStep: 1 } }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when formData is missing', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(authedGetUserResult))
    const res = await PUT(makePutRequest({ vehicleId: 'veh-1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when formData is a string instead of object', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(authedGetUserResult))
    const res = await PUT(makePutRequest({ formData: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with saved draft on successful upsert', async () => {
    const savedDraft = {
      id: 'draft-1',
      vehicle_id: 'veh-1',
      form_data: { currentStep: 2 },
      updated_at: '2024-01-01T00:00:00Z',
    }
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: savedDraft, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await PUT(makePutRequest({ vehicleId: 'veh-1', formData: { currentStep: 2 } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('treats missing vehicleId as null (general draft)', async () => {
    const savedDraft = {
      id: 'draft-2',
      vehicle_id: null,
      form_data: { currentStep: 1 },
      updated_at: '2024-01-01T00:00:00Z',
    }
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: savedDraft, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await PUT(makePutRequest({ formData: { currentStep: 1 } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when upsert fails', async () => {
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: 'Upsert failed' } })
        }
        return (..._args: unknown[]) => new Proxy({}, handler)
      },
    }
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue(authedGetUserResult) },
      from: vi.fn().mockImplementation(() => new Proxy({}, handler)),
    }
    mockCreateClient.mockResolvedValue(supabase)
    const res = await PUT(makePutRequest({ formData: { currentStep: 1 } }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/financing/drafts
// ────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/financing/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
  })

  it('returns 403 when origin validation fails', async () => {
    mockValidateOrigin.mockReturnValue(false)
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(authedGetUserResult))
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?id=draft-1'))
    expect(res.status).toBe(403)
  })

  it('returns 401 when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(unauthGetUserResult))
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?id=draft-1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when neither id nor vehicleId param is provided', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(authedGetUserResult))
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 200 when deleting by draft id', async () => {
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: null, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?id=draft-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ deleted: true })
  })

  it('returns 200 when deleting by vehicleId', async () => {
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: null, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?vehicleId=veh-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ deleted: true })
  })

  it('returns 200 when deleting general draft (vehicleId param present but empty)', async () => {
    const supabase = createMockSupabaseClient(authedGetUserResult, { data: null, error: null })
    mockCreateClient.mockResolvedValue(supabase)
    // vehicleId param is present but empty string → should delete the "general" (null vehicle_id) draft
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?vehicleId='))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ deleted: true })
  })

  it('returns 500 when the delete query fails', async () => {
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: 'Delete error' } })
        }
        return (..._args: unknown[]) => new Proxy({}, handler)
      },
    }
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue(authedGetUserResult) },
      from: vi.fn().mockImplementation(() => new Proxy({}, handler)),
    }
    mockCreateClient.mockResolvedValue(supabase)
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?id=draft-1'))
    expect(res.status).toBe(500)
  })

  it('id param takes precedence over vehicleId when both are provided', async () => {
    // Both id and vehicleId present — the route uses draftId branch (id takes priority)
    const fromSpy = vi.fn()
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue(authedGetUserResult) },
      from: fromSpy.mockImplementation(() => {
        const handler: ProxyHandler<Record<string, unknown>> = {
          get(_target, prop: string) {
            if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
            return (..._args: unknown[]) => new Proxy({}, handler)
          },
        }
        return new Proxy({}, handler)
      }),
    }
    mockCreateClient.mockResolvedValue(supabase)
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/v1/financing/drafts?id=draft-99&vehicleId=veh-2'))
    expect(res.status).toBe(200)
  })
})