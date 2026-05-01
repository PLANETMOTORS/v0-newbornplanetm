import { describe, it, expect, vi, beforeEach } from "vitest"
import { z } from "zod"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"

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

const getAdminByEmailMock = vi.fn()

vi.mock("@/lib/admin/users/repository", () => ({
  getAdminByEmail: (email: string) => getAdminByEmailMock(email),
}))

const { requireAdmin, requireFeatureAccess, parseJsonBody } = await import(
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
  // Default: no DB record, so env-listed admins still work
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

  it("returns ok with db-based admin info including role and permissions", async () => {
    currentUserEmail = "dbadmin@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "abc",
        email: "dbadmin@x.com",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.email).toBe("dbadmin@x.com")
      expect(r.value.role).toBe("manager")
      expect(r.value.source).toBe("db")
      // Manager preset has admin_users: "none"
      expect(r.value.permissions.admin_users).toBe("none")
    }
  })

  it("returns env admins with full permissions", async () => {
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.source).toBe("env")
      expect(r.value.permissions.admin_users).toBe("full")
    }
  })
})

describe("requireFeatureAccess", () => {
  it("returns null when admin has full access", async () => {
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      const forbidden = requireFeatureAccess(r.value, "admin_users", "full")
      expect(forbidden).toBeNull()
    }
  })

  it("returns 403 when manager tries to access admin_users", async () => {
    currentUserEmail = "manager@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "xyz",
        email: "manager@x.com",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      const forbidden = requireFeatureAccess(r.value, "admin_users", "read")
      expect(forbidden).not.toBeNull()
      expect(forbidden!.status).toBe(403)
      const body = await forbidden!.json()
      expect(body.error.code).toBe("FORBIDDEN")
    }
  })

  it("allows manager to access vehicles with read", async () => {
    currentUserEmail = "manager@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: {
        id: "xyz",
        email: "manager@x.com",
        role: "manager",
        is_active: true,
        permissions: null,
      },
    })
    const r = await requireAdmin()
    expect(r.ok).toBe(true)
    if (r.ok) {
      const forbidden = requireFeatureAccess(r.value, "vehicles", "read")
      expect(forbidden).toBeNull()
    }
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
