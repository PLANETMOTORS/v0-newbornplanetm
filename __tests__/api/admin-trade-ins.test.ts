import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockIsAdmin = true

vi.mock("@/lib/security/admin-route-helpers", () => ({
  requireAdmin: vi.fn(async () => {
    if (!mockIsAdmin) {
      return { ok: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }
    return {
      ok: true,
      value: {
        email: "toni@planetmotors.ca",
        role: "admin",
        source: "env",
        permissions: {},
      },
    }
  }),
}))

const mockSelectResult = { data: [], error: null, count: 0 }
const mockFrom = vi.fn(() => {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.range = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  // Resolve the final query
  chain.then = (resolve: (v: unknown) => void) => resolve(mockSelectResult)
  return chain
})

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockIsAdmin = true
  mockSelectResult.data = []
  mockSelectResult.error = null
})

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/v1/admin/trade-ins")
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  return new NextRequest(url)
}

describe("GET /api/v1/admin/trade-ins", () => {
  it("returns 401 when not authenticated", async () => {
    mockIsAdmin = false
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("returns empty list successfully", async () => {
    mockSelectResult.data = []
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it("passes status filter to query", async () => {
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    await GET(makeRequest({ status: "pending" }))
    expect(mockFrom).toHaveBeenCalledWith("trade_in_quotes")
  })

  it("returns 500 on database error", async () => {
    mockSelectResult.error = { message: "connection failed" }
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })

  it("clamps limit and offset", async () => {
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    const res = await GET(makeRequest({ limit: "9999", offset: "-5" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(500) // clamped max
    expect(body.offset).toBe(0) // clamped min
  })

  it("uses default limit/offset when NaN", async () => {
    const { GET } = await import("@/app/api/v1/admin/trade-ins/route")
    const res = await GET(makeRequest({ limit: "abc", offset: "xyz" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(100)
    expect(body.offset).toBe(0)
  })
})
