import { describe, it, expect, vi, beforeEach } from "vitest"
import { z } from "zod"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
const getAdminByEmailMock = vi.fn(async () => ({ ok: true, value: null }))

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
  ADMIN_EMAILS: ["toni@planetmotors.ca", "ops@planetmotors.ca"],
}))

vi.mock("@/lib/admin/users/repository", () => ({
  getAdminByEmail: (email: string) => getAdminByEmailMock(email),
}))

const { requireAdmin, requirePermission, parseJsonBody } = await import(
  "@/lib/security/admin-route-helpers"
)

function makeJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
  getAdminByEmailMock.mockResolvedValue({ ok: true, value: null })
})

describe("requireAdmin", () => {
  it("returns ok with the email when caller is in ADMIN_EMAILS", async () => {
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.email).toBe("toni@planetmotors.ca")
  })

  it("works for any allowed admin", async () => {
    currentUserEmail = "ops@planetmotors.ca"
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.email).toBe("ops@planetmotors.ca")
  })

  it("returns a 401 NextResponse when there is no user", async () => {
    currentUserEmail = null
    const r = await requireAdmin()
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.status).toBe(401)
      const body = await r.error.json()
      expect(body.error).toBe("Unauthorized")
    }
  })

  it("returns a 401 NextResponse when caller is not an admin", async () => {
    currentUserEmail = "stranger@example.com"
    const r = await requireAdmin()
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.status).toBe(401)
  })

  it("preserves the DB row's role (manager / viewer) when active", async () => {
    currentUserEmail = "manager@planetmotors.ca"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "00000000-0000-0000-0000-000000000099",
        email: "manager@planetmotors.ca",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.role).toBe("manager")
      expect(r.value.source).toBe("db")
      // Manager preset has admin_users:"none" but full leads access.
      expect(r.value.permissions.leads).toBe("full")
      expect(r.value.permissions.admin_users).toBe("none")
    }
  })

  it("falls back to env-list role 'admin' when DB row not present", async () => {
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.role).toBe("admin")
      expect(r.value.source).toBe("env")
      expect(r.value.permissions.admin_users).toBe("full")
    }
  })

  it("rejects DB row with is_active=false even when in env list", async () => {
    // Active env-list members are still admins, but a DB row that
    // exists and is_active=false would short-circuit ok via the env
    // path. We assert env wins when DB row is null/undefined; if a
    // db row exists with is_active=false, we still fall back to env.
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "x",
        email: "toni@planetmotors.ca",
        role: "viewer",
        is_active: false,
        permissions: null,
      },
    })
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.source).toBe("env")
      expect(r.value.role).toBe("admin")
    }
  })
})

describe("requirePermission", () => {
  it("returns 401 when caller is not signed in", async () => {
    currentUserEmail = null
    const r = await requirePermission("leads", "read")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.status).toBe(401)
  })

  it("returns 401 when caller is not an admin at all", async () => {
    currentUserEmail = "stranger@example.com"
    const r = await requirePermission("leads", "read")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.status).toBe(401)
  })

  it("allows env-list admins on every feature at every level", async () => {
    const r = await requirePermission("admin_users", "full")
    expect(r.ok).toBe(true)
  })

  it("rejects manager with 403 on admin_users (preset = none)", async () => {
    currentUserEmail = "manager@planetmotors.ca"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "x",
        email: "manager@planetmotors.ca",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requirePermission("admin_users", "read")
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.status).toBe(403)
      const body = await r.error.json()
      expect(body.error.code).toBe("FORBIDDEN")
    }
  })

  it("allows manager on leads at full access (preset)", async () => {
    currentUserEmail = "manager@planetmotors.ca"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "x",
        email: "manager@planetmotors.ca",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requirePermission("leads", "full")
    expect(r.ok).toBe(true)
  })

  it("rejects viewer with 403 even on read of admin_users", async () => {
    currentUserEmail = "viewer@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "v",
        email: "viewer@x.com",
        role: "viewer",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requirePermission("admin_users", "read")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.status).toBe(403)
  })

  it("respects per-user permission overrides", async () => {
    currentUserEmail = "viewer@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "v",
        email: "viewer@x.com",
        role: "viewer",
        is_active: true,
        // grants this specific viewer full access to leads
        permissions: { leads: "full" },
      },
    })
    const r = await requirePermission("leads", "full")
    expect(r.ok).toBe(true)
    // But unrelated features still rejected
    const r2 = await requirePermission("admin_users", "read")
    expect(r2.ok).toBe(false)
  })
})

const sampleSchema = z
  .object({ name: z.string(), age: z.number().int().nonnegative() })
  .strict()

describe("parseJsonBody", () => {
  it("parses + validates a well-formed body", async () => {
    const req = makeJsonRequest({ name: "Toni", age: 39 })
    const r = await parseJsonBody(req, sampleSchema)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ name: "Toni", age: 39 })
  })

  it("returns 400 on malformed JSON", async () => {
    const req = makeJsonRequest("not-json{")
    const r = await parseJsonBody(req, sampleSchema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.status).toBe(400)
      const body = await r.error.json()
      expect(body.error).toMatch(/JSON/)
    }
  })

  it("returns 400 with field-prefixed messages on validation failure", async () => {
    const req = makeJsonRequest({ name: "Toni", age: -1 })
    const r = await parseJsonBody(req, sampleSchema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      const body = await r.error.json()
      expect(body.error).toContain("age")
    }
  })

  it("returns (root) prefix when the input is valid JSON but the wrong type", async () => {
    const req = makeJsonRequest(42)
    const r = await parseJsonBody(req, sampleSchema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      const body = await r.error.json()
      expect(body.error).toMatch(/\(root\)|Expected/)
    }
  })

  it("rejects unknown extra keys when schema is strict", async () => {
    const req = makeJsonRequest({ name: "Toni", age: 1, extra: true })
    const r = await parseJsonBody(req, sampleSchema)
    expect(r.ok).toBe(false)
  })

  it("returns the typed value (not the raw input)", async () => {
    const trimmingSchema = z
      .object({ name: z.string().trim() })
      .strict()
    const req = makeJsonRequest({ name: "  Toni  " })
    const r = await parseJsonBody(req, trimmingSchema)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toBe("Toni")
  })
})
