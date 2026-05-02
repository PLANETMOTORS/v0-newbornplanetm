/**
 * Coverage for lib/admin-api.ts — drives SonarCloud new_coverage condition.
 * Pattern matches __tests__/lib/coverage-followup-883.test.ts (vi.mock at top, dynamic import inside `it`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

// ── Module-level mock state ─────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockCreateClient = vi.fn(async () => ({ auth: { getUser: mockGetUser } }))
const mockCreateAdminClient = vi.fn(() => ({ admin: true }))
const mockIsAdminEmail = vi.fn((email: string | null | undefined) =>
  email === 'admin@planetmotors.ca',
)

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))
vi.mock('@/lib/admin', () => ({
  isAdminEmail: mockIsAdminEmail,
}))

beforeEach(() => {
  mockGetUser.mockReset()
  mockCreateClient.mockClear()
  mockCreateAdminClient.mockReset()
  mockCreateAdminClient.mockImplementation(() => ({ admin: true }))
  mockIsAdminEmail.mockClear()
  mockIsAdminEmail.mockImplementation(
    (email: string | null | undefined) => email === 'admin@planetmotors.ca',
  )
})

afterEach(() => {
  vi.resetModules()
})

// ── authenticateAdmin ───────────────────────────────────────────────────────
describe('authenticateAdmin', () => {
  it('returns 401 when no user is logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { authenticateAdmin } = await import('@/lib/admin-api')

    const result = await authenticateAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response).toBeInstanceOf(NextResponse)
      expect(result.response.status).toBe(401)
      const body = await result.response.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    }
  })

  it('returns 401 when user is not an admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: '1', email: 'random@example.com' } },
    })
    const { authenticateAdmin } = await import('@/lib/admin-api')

    const result = await authenticateAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
    expect(mockIsAdminEmail).toHaveBeenCalledWith('random@example.com')
  })

  it('returns 500 when admin client cannot be constructed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: '1', email: 'admin@planetmotors.ca' } },
    })
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
    })
    const { authenticateAdmin } = await import('@/lib/admin-api')

    const result = await authenticateAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(500)
      const body = await result.response.json()
      expect(body).toEqual({ error: 'Admin client not configured' })
    }
  })

  it('returns admin client when user is an admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: '1', email: 'admin@planetmotors.ca' } },
    })
    const { authenticateAdmin } = await import('@/lib/admin-api')

    const result = await authenticateAdmin()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.adminClient).toBeDefined()
    }
    expect(mockCreateAdminClient).toHaveBeenCalledOnce()
  })

  it('handles missing email on user object as non-admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '1' } } })
    const { authenticateAdmin } = await import('@/lib/admin-api')

    const result = await authenticateAdmin()
    expect(result.ok).toBe(false)
  })
})

// ── parsePagination ─────────────────────────────────────────────────────────
describe('parsePagination', () => {
  it('returns defaults when no params are present', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(parsePagination(new URLSearchParams())).toEqual({ limit: 50, offset: 0 })
  })

  it('respects custom defaults', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(parsePagination(new URLSearchParams(), { limit: 25 })).toEqual({
      limit: 25,
      offset: 0,
    })
  })

  it('clamps limit to the configured maximum', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(
      parsePagination(new URLSearchParams('limit=999'), { maxLimit: 100 }),
    ).toEqual({ limit: 100, offset: 0 })
  })

  it('clamps limit to a minimum of 1', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(parsePagination(new URLSearchParams('limit=-5'))).toEqual({
      limit: 1,
      offset: 0,
    })
    expect(parsePagination(new URLSearchParams('limit=0'))).toEqual({
      limit: 1,
      offset: 0,
    })
  })

  it('falls back to default when limit is NaN', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(
      parsePagination(new URLSearchParams('limit=banana'), { limit: 12 }),
    ).toEqual({ limit: 12, offset: 0 })
  })

  it('clamps offset to >= 0 and falls back to 0 on NaN', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(parsePagination(new URLSearchParams('offset=-3'))).toEqual({
      limit: 50,
      offset: 0,
    })
    expect(parsePagination(new URLSearchParams('offset=banana'))).toEqual({
      limit: 50,
      offset: 0,
    })
  })

  it('parses valid limit and offset together', async () => {
    const { parsePagination } = await import('@/lib/admin-api')
    expect(parsePagination(new URLSearchParams('limit=20&offset=40'))).toEqual({
      limit: 20,
      offset: 40,
    })
  })
})

// ── sanitizeSearch ──────────────────────────────────────────────────────────
describe('sanitizeSearch', () => {
  it('strips disallowed characters by default', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    expect(sanitizeSearch("Bob's, (cars)*&^!")).toBe('Bobs cars')
  })

  it('preserves alphanumerics, spaces, and hyphens', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    expect(sanitizeSearch('Land Rover-2023 X5')).toBe('Land Rover-2023 X5')
  })

  it('allows email characters when allowEmail=true', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    expect(sanitizeSearch('user@example.com', { allowEmail: true })).toBe(
      'user@example.com',
    )
  })

  it('strips @ and . by default', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    expect(sanitizeSearch('user@example.com')).toBe('userexamplecom')
  })

  it('trims and caps the input length to 200 characters', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    const huge = '   ' + 'a'.repeat(500) + '   '
    const out = sanitizeSearch(huge)
    expect(out.length).toBe(200)
    expect(out).toBe('a'.repeat(200))
  })

  it('returns empty string for input that is fully sanitized away', async () => {
    const { sanitizeSearch } = await import('@/lib/admin-api')
    expect(sanitizeSearch('!!!@@@###')).toBe('')
  })
})

// ── getSearchParams ─────────────────────────────────────────────────────────
describe('getSearchParams', () => {
  it('returns the URLSearchParams from a request URL', async () => {
    const { getSearchParams } = await import('@/lib/admin-api')
    const req = { url: 'https://example.com/api/admin?foo=bar&limit=10' } as unknown as import('next/server').NextRequest
    const params = getSearchParams(req)
    expect(params.get('foo')).toBe('bar')
    expect(params.get('limit')).toBe('10')
  })

  it('returns empty params when no query string is present', async () => {
    const { getSearchParams } = await import('@/lib/admin-api')
    const req = { url: 'https://example.com/api/admin' } as unknown as import('next/server').NextRequest
    expect(getSearchParams(req).toString()).toBe('')
  })
})
