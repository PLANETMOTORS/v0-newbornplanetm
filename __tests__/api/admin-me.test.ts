import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
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
  getAdminByEmail: (email: string) => getAdminByEmailMock(email),
}))

const { GET } = await import("@/app/api/v1/admin/me/route")

beforeEach(() => {
  vi.clearAllMocks()
  getAdminByEmailMock.mockResolvedValue({ ok: false })
})

describe("GET /api/v1/admin/me", () => {
  it("returns isAdmin:false when no user", async () => {
    currentUserEmail = null
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ isAdmin: false, email: null })
  })

  it("returns isAdmin:false when user is signed in but not admin", async () => {
    currentUserEmail = "stranger@example.com"
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(false)
    expect(body.email).toBe("stranger@example.com")
  })

  it("returns isAdmin:true with source=db and role/permissions when row found", async () => {
    currentUserEmail = "newadmin@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: { email: "newadmin@x.com", role: "manager", is_active: true, permissions: { leads: "full" } },
    })
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(true)
    expect(body.source).toBe("db")
    expect(body.role).toBe("manager")
    expect(body.permissions).toEqual({ leads: "full" })
  })

  it("returns permissions:null when db row has no custom permissions", async () => {
    currentUserEmail = "newadmin@x.com"
    getAdminByEmailMock.mockResolvedValue({
      ok: true,
      value: { email: "newadmin@x.com", role: "admin", is_active: true, permissions: null },
    })
    const res = await GET()
    const body = await res.json()
    expect(body.permissions).toBeNull()
  })

  it("returns isAdmin:true with source=env when env-listed", async () => {
    currentUserEmail = "toni@planetmotors.ca"
    getAdminByEmailMock.mockResolvedValue({ ok: false })
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(true)
    expect(body.source).toBe("env")
    expect(body.permissions).toBeNull()
  })

  it("treats DB lookup throw as fallback to env check", async () => {
    currentUserEmail = "toni@planetmotors.ca"
    getAdminByEmailMock.mockRejectedValue(new Error("boom"))
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(true)
    expect(body.source).toBe("env")
  })

  it("treats DB lookup throw as not-admin for non-env user", async () => {
    currentUserEmail = "x@y.com"
    getAdminByEmailMock.mockRejectedValue(new Error("boom"))
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(false)
  })
})
