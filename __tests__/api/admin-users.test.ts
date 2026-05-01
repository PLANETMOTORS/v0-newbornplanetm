import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
const isActiveAdminMock = vi.fn(async () => false)
const getAdminByEmailMock = vi.fn(async () => ({ ok: true, value: null }))
const listAdminsMock = vi.fn()
const inviteAdminMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: { user: currentUserEmail ? { email: currentUserEmail } : null },
      }),
    },
  })),
}))

vi.mock("@/lib/admin", () => ({
  ADMIN_EMAILS: ["toni@planetmotors.ca", "admin@planetmotors.ca"],
}))

vi.mock("@/lib/admin/users/repository", () => ({
  isActiveAdmin: (email: string) => isActiveAdminMock(email),
  getAdminByEmail: (email: string) => getAdminByEmailMock(email),
  listAdmins: () => listAdminsMock(),
  inviteAdmin: (input: unknown, by: unknown) => inviteAdminMock(input, by),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const SAMPLE_ROW = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "toni@planetmotors.ca",
  role: "admin" as const,
  is_active: true,
  invited_by: null,
  notes: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}

const { GET, POST } = await import("@/app/api/v1/admin/users/route")

function makePost(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
  isActiveAdminMock.mockResolvedValue(false)
  getAdminByEmailMock.mockResolvedValue({ ok: true, value: null })
})

describe("GET /api/v1/admin/users — auth", () => {
  it("rejects when no user", async () => {
    currentUserEmail = null
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("rejects when user is not an admin", async () => {
    currentUserEmail = "stranger@example.com"
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("allows env-listed admins", async () => {
    listAdminsMock.mockResolvedValue({ ok: true, value: [SAMPLE_ROW] })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.admins).toEqual([SAMPLE_ROW])
  })

  it("allows DB-listed admins (DB checked even when not in env)", async () => {
    currentUserEmail = "newadmin@x.com"
    isActiveAdminMock.mockResolvedValue(true)
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: { ...SAMPLE_ROW, email: "newadmin@x.com", role: "admin", is_active: true },
    })
    listAdminsMock.mockResolvedValue({ ok: true, value: [] })
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("returns 500 on repo db-error", async () => {
    listAdminsMock.mockResolvedValue({
      ok: false,
      error: { kind: "db-error", message: "select failed" },
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("returns 500 on repo exception", async () => {
    listAdminsMock.mockResolvedValue({
      ok: false,
      error: { kind: "exception", message: "boom" },
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe("POST /api/v1/admin/users — auth + validation", () => {
  it("rejects when no user", async () => {
    currentUserEmail = null
    const res = await POST(makePost({ email: "a@b.com" }))
    expect(res.status).toBe(401)
  })

  it("rejects when user is not admin", async () => {
    currentUserEmail = "stranger@example.com"
    const res = await POST(makePost({ email: "a@b.com" }))
    expect(res.status).toBe(401)
  })

  it("rejects malformed JSON with 400", async () => {
    const res = await POST(makePost("not-json{"))
    expect(res.status).toBe(400)
  })

  it("rejects body missing email with 400", async () => {
    const res = await POST(makePost({ role: "admin" }))
    expect(res.status).toBe(400)
  })

  it("rejects invalid email with 400", async () => {
    const res = await POST(makePost({ email: "not-an-email" }))
    expect(res.status).toBe(400)
  })

  it("rejects unknown role with 400", async () => {
    const res = await POST(makePost({ email: "a@b.com", role: "ceo" }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/v1/admin/users — happy path + repo errors", () => {
  it("returns 201 with the created row", async () => {
    inviteAdminMock.mockResolvedValue({ ok: true, value: SAMPLE_ROW })
    const res = await POST(makePost({ email: "new@x.com", role: "manager" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.admin).toEqual(SAMPLE_ROW)
  })

  it("returns 409 on duplicate-email", async () => {
    inviteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "duplicate-email", email: "dup@x.com" },
    })
    const res = await POST(makePost({ email: "dup@x.com", role: "admin" }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("DUPLICATE_EMAIL")
  })

  it("returns 500 on repo db-error", async () => {
    inviteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "db-error", message: "rls denied" },
    })
    const res = await POST(makePost({ email: "ok@x.com", role: "admin" }))
    expect(res.status).toBe(500)
  })

  it("returns 500 on repo exception", async () => {
    inviteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "exception", message: "boom" },
    })
    const res = await POST(makePost({ email: "ok@x.com", role: "admin" }))
    expect(res.status).toBe(500)
  })

  it("returns 404 on repo not-found (defensive)", async () => {
    inviteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "not-found" },
    })
    const res = await POST(makePost({ email: "ok@x.com", role: "admin" }))
    expect(res.status).toBe(404)
  })
})

describe("server-side permission enforcement", () => {
  // Same caller authenticated and active, but only "manager" role.
  // The default manager preset has admin_users: "none", so they should
  // be unable to list, invite, or otherwise touch the admin roster
  // even by hitting the API directly.
  const MANAGER_CALLER = {
    id: "00000000-0000-0000-0000-0000000000cc",
    email: "manager-caller@x.com",
    role: "manager" as const,
    is_active: true,
    permissions: null,
    invited_by: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  }

  it("GET rejects manager-role caller with 403 (no admin_users.read)", async () => {
    currentUserEmail = MANAGER_CALLER.email
    isActiveAdminMock.mockResolvedValue(true)
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: MANAGER_CALLER })
    const res = await GET()
    expect(res.status).toBe(403)
    expect(listAdminsMock).not.toHaveBeenCalled()
  })

  it("POST (invite) rejects manager-role caller with 403", async () => {
    currentUserEmail = MANAGER_CALLER.email
    isActiveAdminMock.mockResolvedValue(true)
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: MANAGER_CALLER })
    const res = await POST(makePost({ email: "new@x.com", role: "admin" }))
    expect(res.status).toBe(403)
    expect(inviteAdminMock).not.toHaveBeenCalled()
  })
})
