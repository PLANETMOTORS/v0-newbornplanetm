import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ────────────────────────────────────────────────────────────────────────────
// Mock factories
// ────────────────────────────────────────────────────────────────────────────

/**
 * Creates a chainable Supabase admin client mock.
 * The proxy resolves to `queryResult` at every `await` point.
 * `deleteUser` is separately controlled via `deleteUserResult`.
 */
function createMockAdminClient(
  queryResult: { data?: unknown; error?: unknown } = { data: null, error: null },
  deleteUserResult: { error: unknown } = { error: null },
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
    from: vi.fn().mockImplementation(() => proxyBuilder()),
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue(deleteUserResult),
      },
    },
  }
}

function createMockServerClient(
  getUserResult: { data: { user: { id: string; email?: string } | null }; error: unknown },
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(getUserResult),
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Module-level mock hooks — redefined in each test via mockImplementation
// ────────────────────────────────────────────────────────────────────────────
let mockCreateClient = vi.fn()
let mockCreateAdminClientFn = vi.fn()
let mockValidateOrigin = vi.fn().mockReturnValue(true)

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClientFn(...args),
}))

vi.mock('@/lib/csrf', () => ({
  validateOrigin: (...args: unknown[]) => mockValidateOrigin(...args),
}))

const { DELETE } = await import('@/app/api/v1/customers/me/delete/route')

// ────────────────────────────────────────────────────────────────────────────
// Request helper
// ────────────────────────────────────────────────────────────────────────────
function makeDeleteRequest() {
  return new NextRequest('http://localhost:3000/api/v1/customers/me/delete', {
    method: 'DELETE',
    headers: { origin: 'http://localhost:3000' },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Shared test data
// ────────────────────────────────────────────────────────────────────────────
const authedUser = { id: 'user-abc', email: 'user@example.com' }
const authedGetUserResult = { data: { user: authedUser }, error: null }
const unauthGetUserResult = { data: { user: null }, error: new Error('Unauthenticated') }

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/customers/me/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateOrigin.mockReturnValue(true)
  })

  it('returns 403 when origin validation fails', async () => {
    mockValidateOrigin.mockReturnValue(false)
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(createMockAdminClient())
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('returns 401 when user is not authenticated (auth error)', async () => {
    mockCreateClient.mockResolvedValue(createMockServerClient(unauthGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(createMockAdminClient())
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 when user is null without an auth error', async () => {
    mockCreateClient.mockResolvedValue(createMockServerClient({ data: { user: null }, error: null }))
    mockCreateAdminClientFn.mockReturnValue(createMockAdminClient())
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(401)
  })

  it('returns 200 with deleted:true on successful deletion', async () => {
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(createMockAdminClient({ data: null, error: null }, { error: null }))
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ deleted: true })
  })

  it('calls admin deleteUser with the authenticated user id', async () => {
    const adminClient = createMockAdminClient({ data: null, error: null }, { error: null })
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(adminClient)
    await DELETE(makeDeleteRequest())
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(authedUser.id)
  })

  it('returns 500 when deleteUser fails', async () => {
    const adminClient = createMockAdminClient(
      { data: null, error: null },
      { error: { message: 'Auth delete failed' } },
    )
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(adminClient)
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })

  it('cleans up all three tables before deleting the auth user', async () => {
    const adminClient = createMockAdminClient({ data: null, error: null }, { error: null })
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(adminClient)
    await DELETE(makeDeleteRequest())
    // from() should be called 3 times: price_alerts, finance_application_drafts, profiles
    expect(adminClient.from).toHaveBeenCalledWith('price_alerts')
    expect(adminClient.from).toHaveBeenCalledWith('finance_application_drafts')
    expect(adminClient.from).toHaveBeenCalledWith('profiles')
  })

  it('continues cleanup even when a table delete fails (partial failure tolerance)', async () => {
    // First table delete errors; subsequent calls and deleteUser should still succeed
    let callCount = 0
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop: string) {
        if (prop === 'then') {
          callCount++
          const result = callCount === 1
            ? { data: null, error: { message: 'Table error' } }
            : { data: null, error: null }
          return (resolve: (v: unknown) => void) => resolve(result)
        }
        return (..._args: unknown[]) => new Proxy({}, handler)
      },
    }
    const adminClient = {
      from: vi.fn().mockImplementation(() => new Proxy({}, handler)),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    }
    mockCreateClient.mockResolvedValue(createMockServerClient(authedGetUserResult))
    mockCreateAdminClientFn.mockReturnValue(adminClient)
    const res = await DELETE(makeDeleteRequest())
    // Should succeed overall — partial cleanup failure doesn't abort
    expect(res.status).toBe(200)
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(authedUser.id)
  })

  it('skips table cleanup for entries with no value (email is undefined)', async () => {
    // User with no email — price_alerts cleanup should be skipped
    const userWithoutEmail = { id: 'user-no-email', email: undefined }
    const adminClient = createMockAdminClient({ data: null, error: null }, { error: null })
    mockCreateClient.mockResolvedValue(
      createMockServerClient({ data: { user: userWithoutEmail as unknown as { id: string } }, error: null }),
    )
    mockCreateAdminClientFn.mockReturnValue(adminClient)
    await DELETE(makeDeleteRequest())
    // price_alerts uses email — should NOT be called since email is undefined
    const fromCalls = adminClient.from.mock.calls.map((c: unknown[]) => c[0])
    expect(fromCalls).not.toContain('price_alerts')
    // finance_application_drafts and profiles should still run
    expect(fromCalls).toContain('finance_application_drafts')
    expect(fromCalls).toContain('profiles')
  })

  it('returns 500 on unhandled exception', async () => {
    mockCreateClient.mockRejectedValue(new Error('Unexpected crash'))
    mockCreateAdminClientFn.mockReturnValue(createMockAdminClient())
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})