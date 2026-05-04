import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

const mockGetAdminById = vi.fn()
vi.mock("@/lib/admin/users/repository", () => ({
  getAdminById: (...args: unknown[]) => mockGetAdminById(...args),
}))

const mockSendEmail = vi.fn()
vi.mock("@/lib/email", () => ({
  sendAdminInvitationEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockAuthOk = true
vi.mock("@/lib/security/admin-route-helpers", () => ({
  requirePermission: vi.fn(async () => {
    if (!mockAuthOk)
      return { ok: false, error: { status: 403 } }
    return { ok: true, value: { email: "admin@planetmotors.ca" } }
  }),
}))

function makeRequest(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/v1/admin/users/${id}/resend`, { method: "POST" })
  return [req, { params: Promise.resolve({ id }) }]
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthOk = true
})

describe("POST /api/v1/admin/users/[id]/resend", () => {
  it("returns 403 when user lacks admin_users permission", async () => {
    mockAuthOk = false
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("00000000-0000-0000-0000-000000000001")
    const res = await POST(req, ctx)
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid UUID", async () => {
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("not-a-uuid")
    const res = await POST(req, ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Invalid")
  })

  it("returns 500 when getAdminById fails", async () => {
    mockGetAdminById.mockResolvedValueOnce({ ok: false, error: { kind: "db-error" } })
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("00000000-0000-0000-0000-000000000001")
    const res = await POST(req, ctx)
    expect(res.status).toBe(500)
  })

  it("returns 404 when admin user not found", async () => {
    mockGetAdminById.mockResolvedValueOnce({ ok: true, value: null })
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("00000000-0000-0000-0000-000000000001")
    const res = await POST(req, ctx)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toContain("not found")
  })

  it("returns 502 when email send fails", async () => {
    mockGetAdminById.mockResolvedValueOnce({
      ok: true,
      value: { email: "new@example.com", role: "manager", notes: null },
    })
    mockSendEmail.mockResolvedValueOnce({ success: false, error: "Rate limit" })
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("00000000-0000-0000-0000-000000000001")
    const res = await POST(req, ctx)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toContain("Failed to send")
  })

  it("returns 200 and resends the invitation on success", async () => {
    mockGetAdminById.mockResolvedValueOnce({
      ok: true,
      value: { email: "new@example.com", role: "viewer", notes: "Welcome!" },
    })
    mockSendEmail.mockResolvedValueOnce({ success: true })
    const { POST } = await import("@/app/api/v1/admin/users/[id]/resend/route")
    const [req, ctx] = makeRequest("00000000-0000-0000-0000-000000000001")
    const res = await POST(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.email).toBe("new@example.com")
    expect(mockSendEmail).toHaveBeenCalledWith({
      email: "new@example.com",
      role: "viewer",
      invitedBy: "admin@planetmotors.ca",
      notes: "Welcome!",
    })
  })
})
