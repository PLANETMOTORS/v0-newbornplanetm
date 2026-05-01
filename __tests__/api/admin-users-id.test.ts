import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
const isActiveAdminMock = vi.fn(async () => false)
const updateAdminMock = vi.fn()
const deleteAdminMock = vi.fn()
const getAdminByEmailMock = vi.fn()

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
  updateAdmin: (id: string, patch: unknown) => updateAdminMock(id, patch),
  deleteAdmin: (id: string) => deleteAdminMock(id),
  getAdminByEmail: (email: string) => getAdminByEmailMock(email),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const SAMPLE_ROW = {
  id: "00000000-0000-0000-0000-000000000099",
  email: "manager@planetmotors.ca",
  role: "manager" as const,
  is_active: true,
  invited_by: null,
  notes: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}
// Caller acting as themselves is an admin (per ADMIN_EMAILS) — needed
// so requirePermission("admin_users","full") passes the gate before
// self-protection runs.
const SELF_ROW = {
  ...SAMPLE_ROW,
  email: "toni@planetmotors.ca",
  role: "admin" as const,
}

const { PATCH, DELETE } = await import("@/app/api/v1/admin/users/[id]/route")

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/users/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
  isActiveAdminMock.mockResolvedValue(false)
  getAdminByEmailMock.mockResolvedValue({ ok: true, value: null })
})

describe("PATCH /[id] — auth + param validation", () => {
  it("rejects when no user", async () => {
    currentUserEmail = null
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(401)
  })

  it("rejects when user not admin", async () => {
    currentUserEmail = "stranger@example.com"
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(401)
  })

  it("rejects 400 when id is not a uuid", async () => {
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx("not-a-uuid"))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when patch body invalid", async () => {
    const res = await PATCH(makeReq("not-json{"), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when patch is empty", async () => {
    const res = await PATCH(makeReq({}), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(400)
  })
})

describe("PATCH /[id] — happy path + repo errors", () => {
  it("returns 200 with updated row on success", async () => {
    updateAdminMock.mockResolvedValue({ ok: true, value: SAMPLE_ROW })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.admin).toEqual(SAMPLE_ROW)
  })

  it("returns 404 when row not found", async () => {
    updateAdminMock.mockResolvedValue({ ok: false, error: { kind: "not-found" } })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(404)
  })

  it("returns 500 on repo db-error", async () => {
    updateAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "db-error", message: "rls" },
    })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(500)
  })

  it("returns 500 on repo exception", async () => {
    updateAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "exception", message: "boom" },
    })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(500)
  })

  it("returns 409 on repo duplicate-email", async () => {
    updateAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "duplicate-email", email: "x@x.com" },
    })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(409)
  })
})

describe("PATCH /[id] — self-protection", () => {
  it("blocks deactivating self", async () => {
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: SELF_ROW })
    const res = await PATCH(
      makeReq({ is_active: false }),
      makeCtx(SELF_ROW.id),
    )
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("SELF_DEMOTION_FORBIDDEN")
  })

  it("blocks self-demotion to viewer", async () => {
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: SELF_ROW })
    const res = await PATCH(
      makeReq({ role: "viewer" }),
      makeCtx(SELF_ROW.id),
    )
    expect(res.status).toBe(409)
  })

  it("allows promoting another admin's role", async () => {
    updateAdminMock.mockResolvedValue({ ok: true, value: SAMPLE_ROW })
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: SELF_ROW })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(200)
  })

  it("allows self to update own notes", async () => {
    updateAdminMock.mockResolvedValue({
      ok: true,
      value: { ...SELF_ROW, notes: "added a note" },
    })
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: SELF_ROW })
    const res = await PATCH(
      makeReq({ notes: "added a note" }),
      makeCtx(SELF_ROW.id),
    )
    expect(res.status).toBe(200)
  })
})

describe("DELETE /[id]", () => {
  it("rejects when no user", async () => {
    currentUserEmail = null
    const ctx = makeCtx(SAMPLE_ROW.id)
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      ctx,
    )
    expect(res.status).toBe(401)
  })

  it("rejects 400 when id is invalid", async () => {
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx("not-uuid"),
    )
    expect(res.status).toBe(400)
  })

  it("blocks self-delete", async () => {
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: SELF_ROW })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SELF_ROW.id),
    )
    expect(res.status).toBe(409)
  })

  it("returns 200 with deletedId on success", async () => {
    deleteAdminMock.mockResolvedValue({ ok: true, value: { id: SAMPLE_ROW.id } })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SAMPLE_ROW.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deletedId).toBe(SAMPLE_ROW.id)
  })

  it("returns 404 when not found", async () => {
    deleteAdminMock.mockResolvedValue({ ok: false, error: { kind: "not-found" } })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SAMPLE_ROW.id),
    )
    expect(res.status).toBe(404)
  })

  it("returns 500 on repo db-error", async () => {
    deleteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "db-error", message: "boom" },
    })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SAMPLE_ROW.id),
    )
    expect(res.status).toBe(500)
  })

  it("returns 500 on repo exception", async () => {
    deleteAdminMock.mockResolvedValue({
      ok: false,
      error: { kind: "exception", message: "boom" },
    })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SAMPLE_ROW.id),
    )
    expect(res.status).toBe(500)
  })
})

describe("server-side permission enforcement", () => {
  // Same caller authenticated, but their authoritative DB row only
  // grants "manager" role. The default manager preset has
  // admin_users: "none", so even though they're logged in as an admin
  // user, the API must reject mutating peers.
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

  it("PATCH rejects manager-role caller with 403", async () => {
    currentUserEmail = MANAGER_CALLER.email
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: MANAGER_CALLER })
    const res = await PATCH(makeReq({ role: "admin" }), makeCtx(SAMPLE_ROW.id))
    expect(res.status).toBe(403)
    expect(updateAdminMock).not.toHaveBeenCalled()
  })

  it("DELETE rejects manager-role caller with 403", async () => {
    currentUserEmail = MANAGER_CALLER.email
    getAdminByEmailMock.mockResolvedValue({ ok: true, value: MANAGER_CALLER })
    const res = await DELETE(
      new NextRequest("http://localhost/x", { method: "DELETE" }),
      makeCtx(SAMPLE_ROW.id),
    )
    expect(res.status).toBe(403)
    expect(deleteAdminMock).not.toHaveBeenCalled()
  })
})
