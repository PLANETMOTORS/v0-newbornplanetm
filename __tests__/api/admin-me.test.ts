import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
const isActiveAdminMock = vi.fn(async () => false)

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
}))

const { GET } = await import("@/app/api/v1/admin/me/route")

beforeEach(() => {
  vi.clearAllMocks()
  isActiveAdminMock.mockResolvedValue(false)
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

  it("returns isAdmin:true with source=db when row found", async () => {
    currentUserEmail = "newadmin@x.com"
    isActiveAdminMock.mockResolvedValue(true)
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(true)
    expect(body.source).toBe("db")
  })

  it("returns isAdmin:true with source=env when env-listed", async () => {
    currentUserEmail = "toni@planetmotors.ca"
    isActiveAdminMock.mockResolvedValue(false)
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(true)
    expect(body.source).toBe("env")
  })

  it("treats DB lookup throw as not-admin", async () => {
    currentUserEmail = "x@y.com"
    isActiveAdminMock.mockRejectedValue(new Error("boom"))
    const res = await GET()
    const body = await res.json()
    expect(body.isAdmin).toBe(false)
  })
})
