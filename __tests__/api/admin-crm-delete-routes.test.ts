import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"
const isActiveAdminMock = vi.fn(async () => false)
const deleteCrmRowMock = vi.fn()

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
  ADMIN_EMAILS: ["toni@planetmotors.ca"],
}))

vi.mock("@/lib/admin/users/repository", () => ({
  isActiveAdmin: (email: string) => isActiveAdminMock(email),
}))

vi.mock("@/lib/admin/crm-delete/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/admin/crm-delete/repository")
  >("@/lib/admin/crm-delete/repository")
  return {
    ...actual,
    deleteCrmRow: (table: string, id: string) => deleteCrmRowMock(table, id),
  }
})

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const VALID_ID = "00000000-0000-0000-0000-000000000001"

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
  isActiveAdminMock.mockResolvedValue(false)
})

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/x", { method: "DELETE" })
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

const ROUTE_TABLE_PAIRS = [
  {
    name: "leads",
    table: "leads",
    importer: () => import("@/app/api/v1/admin/leads/[id]/route"),
  },
  {
    name: "finance applications",
    table: "finance_applications_v2",
    importer: () => import("@/app/api/v1/admin/finance/applications/[id]/route"),
  },
  {
    name: "reservations",
    table: "reservations",
    importer: () => import("@/app/api/v1/admin/reservations/[id]/route"),
  },
  {
    name: "trade-ins",
    table: "trade_in_quotes",
    importer: () => import("@/app/api/v1/admin/trade-ins/[id]/route"),
  },
] as const

for (const pair of ROUTE_TABLE_PAIRS) {
  describe(`DELETE /[id] — ${pair.name}`, () => {
    it("rejects with 401 when no user is signed in", async () => {
      currentUserEmail = null
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(401)
    })

    it("rejects with 401 when user is not admin", async () => {
      currentUserEmail = "stranger@example.com"
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(401)
    })

    it("rejects with 400 on a non-uuid id", async () => {
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx("not-a-uuid"))
      expect(res.status).toBe(400)
    })

    it("returns 200 with deletedId on success", async () => {
      deleteCrmRowMock.mockResolvedValue({ ok: true, value: { id: VALID_ID } })
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.deletedId).toBe(VALID_ID)
      expect(deleteCrmRowMock).toHaveBeenCalledWith(pair.table, VALID_ID)
    })

    it("returns 404 when the row does not exist", async () => {
      deleteCrmRowMock.mockResolvedValue({
        ok: false,
        error: { kind: "not-found" },
      })
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(404)
    })

    it("returns 500 on db-error", async () => {
      deleteCrmRowMock.mockResolvedValue({
        ok: false,
        error: { kind: "db-error", message: "rls" },
      })
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(500)
    })

    it("returns 500 on exception", async () => {
      deleteCrmRowMock.mockResolvedValue({
        ok: false,
        error: { kind: "exception", message: "boom" },
      })
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(500)
    })

    it("allows DB-listed admins through (DB gate, not env)", async () => {
      currentUserEmail = "newadmin@x.com"
      isActiveAdminMock.mockResolvedValue(true)
      deleteCrmRowMock.mockResolvedValue({ ok: true, value: { id: VALID_ID } })
      const { DELETE } = await pair.importer()
      const res = await DELETE(makeReq(), ctx(VALID_ID))
      expect(res.status).toBe(200)
    })
  })
}
