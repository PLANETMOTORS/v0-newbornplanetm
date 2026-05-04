import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

// Track what updateSession returns
let mockUser: { email: string } | null = null

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async (request: NextRequest) => ({
    response: NextResponse.next({ request }),
    user: mockUser,
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUser = null
})

async function loadMiddleware() {
  vi.resetModules()
  const mod = await import("@/middleware")
  return mod.middleware
}

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost"))
}

describe("middleware — admin auth gate", () => {
  it("redirects unauthenticated users from /admin to /admin/login", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin"))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login")
  })

  it("includes redirect param when redirecting to login", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/leads"))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get("location")!)
    expect(location.pathname).toBe("/admin/login")
    expect(location.searchParams.get("redirect")).toBe("/admin/leads")
  })

  it("allows unauthenticated access to /admin/login", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/login"))
    expect(res.status).not.toBe(307)
  })

  it("allows unauthenticated access to /admin/forgot-password", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/forgot-password"))
    expect(res.status).not.toBe(307)
  })

  it("allows unauthenticated access to /admin/reset-password", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/reset-password"))
    expect(res.status).not.toBe(307)
  })

  it("allows authenticated users through to admin pages", async () => {
    mockUser = { email: "admin@planetmotors.ca" }
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/dashboard"))
    expect(res.status).not.toBe(307)
  })

  it("allows non-admin pages through without auth", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/cars"))
    expect(res.status).not.toBe(307)
  })

  it("redirects from /admin/users when unauthenticated", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/users"))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get("location")!)
    expect(location.searchParams.get("redirect")).toBe("/admin/users")
  })

  it("allows sub-paths of public admin paths (e.g. /admin/login/callback)", async () => {
    mockUser = null
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/admin/login/callback"))
    expect(res.status).not.toBe(307)
  })
})

describe("middleware — dev route blocking", () => {
  it("blocks /mockup in production", async () => {
    const origEnv = process.env.NODE_ENV
    // @ts-expect-error - overriding read-only for test
    process.env.NODE_ENV = "production"
    const middleware = await loadMiddleware()
    const res = await middleware(makeRequest("/mockup"))
    expect(res.status).toBe(404)
    // @ts-expect-error - restoring
    process.env.NODE_ENV = origEnv
  })
})
