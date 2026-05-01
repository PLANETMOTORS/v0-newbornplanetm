import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

interface MockRow {
  id: string
  customer_name?: string | null
  customer_email?: string | null
}

const fakeDb: Record<string, MockRow[]> = {
  leads: [],
  reservations: [],
  trade_in_quotes: [],
}
const fakeDeleteErrors: Record<string, { message: string } | null> = {
  leads: null,
  reservations: null,
  trade_in_quotes: null,
}
const fakeSelectErrors: Record<string, { message: string } | null> = {
  leads: null,
  reservations: null,
  trade_in_quotes: null,
}

function makeFakeAdminClient() {
  const fromBuilder = (table: string) => ({
    select: () => ({
      or: async () => {
        if (fakeSelectErrors[table]) {
          return { data: null, error: fakeSelectErrors[table] }
        }
        return { data: fakeDb[table], error: null }
      },
    }),
    delete: () => ({
      in: async (_col: string, ids: string[]) => {
        if (fakeDeleteErrors[table]) {
          return { error: fakeDeleteErrors[table], count: null }
        }
        const before = fakeDb[table].length
        fakeDb[table] = fakeDb[table].filter((r) => !ids.includes(r.id))
        const removed = before - fakeDb[table].length
        return { error: null, count: removed }
      },
    }),
  })
  return { from: vi.fn((table: string) => fromBuilder(table)) }
}

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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => makeFakeAdminClient()),
}))

vi.mock("@/lib/admin", () => ({
  ADMIN_EMAILS: ["toni@planetmotors.ca", "admin@planetmotors.ca"],
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { POST } = await import("@/app/api/v1/admin/cleanup/test-data/route")

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/cleanup/test-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function resetDb() {
  fakeDb.leads = [
    { id: "lead-1", customer_name: "Devin Test", customer_email: "devin@example.com" },
    { id: "lead-2", customer_name: "Thigg Egg", customer_email: "thigg@example.com" },
    { id: "lead-3", customer_name: "Real Customer", customer_email: "real@gmail.com" },
  ]
  fakeDb.reservations = [
    { id: "res-1", customer_name: "Devin Test", customer_email: "devin.test@planetmotors.ca" },
    { id: "res-2", customer_name: "Real Person", customer_email: "real@hotmail.com" },
  ]
  fakeDb.trade_in_quotes = [
    { id: "tq-1", customer_name: "Toni Sultzberg", customer_email: "toni@planetmotors.ca" },
  ]
  for (const key of Object.keys(fakeDeleteErrors)) {
    fakeDeleteErrors[key] = null
    fakeSelectErrors[key] = null
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
  resetDb()
})

describe("POST /api/v1/admin/cleanup/test-data — auth gate", () => {
  it("rejects with 401 when no user", async () => {
    currentUserEmail = null
    const res = await POST(makeRequest({ mode: "test-pattern", dryRun: true }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("rejects with 401 when user is not an admin", async () => {
    currentUserEmail = "stranger@example.com"
    const res = await POST(makeRequest({ mode: "test-pattern", dryRun: true }))
    expect(res.status).toBe(401)
  })

  it("allows any address listed in ADMIN_EMAILS", async () => {
    currentUserEmail = "admin@planetmotors.ca"
    const res = await POST(makeRequest({ mode: "test-pattern", dryRun: true }))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/v1/admin/cleanup/test-data — body validation", () => {
  it("rejects 400 on malformed JSON", async () => {
    const res = await POST(makeRequest("not-json{"))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/JSON/)
  })

  it("rejects 400 when body is not an object", async () => {
    const res = await POST(makeRequest("a string"))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when mode is missing", async () => {
    const res = await POST(makeRequest({ table: "leads", ids: ["x"] }))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when mode is unknown", async () => {
    const res = await POST(makeRequest({ mode: "wipe-everything" }))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when by-id table is invalid", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "users", ids: ["a"] }),
    )
    expect(res.status).toBe(400)
  })

  it("rejects 400 when by-id ids is missing", async () => {
    const res = await POST(makeRequest({ mode: "by-id", table: "leads" }))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when by-id ids is empty", async () => {
    const res = await POST(makeRequest({ mode: "by-id", table: "leads", ids: [] }))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when by-id ids exceeds the cap", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `id-${i}`)
    const res = await POST(makeRequest({ mode: "by-id", table: "leads", ids }))
    expect(res.status).toBe(400)
  })

  it("rejects 400 when by-id ids contains non-strings", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "leads", ids: ["a", 1, "c"] }),
    )
    expect(res.status).toBe(400)
  })

  it("rejects 400 when test-pattern dryRun is non-boolean", async () => {
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: "yes" }),
    )
    expect(res.status).toBe(400)
  })
})

describe("POST /api/v1/admin/cleanup/test-data — by-id mode", () => {
  it("deletes the specified rows from leads", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "leads", ids: ["lead-1", "lead-2"] }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, mode: "by-id", table: "leads", deleted: 2 })
    expect(fakeDb.leads.map((r) => r.id)).toEqual(["lead-3"])
  })

  it("returns 0 when ids match no rows", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "leads", ids: ["nonexistent"] }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted).toBe(0)
  })

  it("returns 500 with the table-prefixed error on db failure", async () => {
    fakeDeleteErrors.leads = { message: "FK constraint violation" }
    const res = await POST(
      makeRequest({ mode: "by-id", table: "leads", ids: ["lead-1"] }),
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain("FK constraint")
  })

  it("targets only the requested table", async () => {
    await POST(
      makeRequest({ mode: "by-id", table: "leads", ids: ["lead-1"] }),
    )
    expect(fakeDb.reservations).toHaveLength(2)
    expect(fakeDb.trade_in_quotes).toHaveLength(1)
  })

  it("targets reservations independently", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "reservations", ids: ["res-1"] }),
    )
    expect(res.status).toBe(200)
    expect(fakeDb.reservations.map((r) => r.id)).toEqual(["res-2"])
  })

  it("targets trade_in_quotes independently", async () => {
    const res = await POST(
      makeRequest({ mode: "by-id", table: "trade_in_quotes", ids: ["tq-1"] }),
    )
    expect(res.status).toBe(200)
    expect(fakeDb.trade_in_quotes).toHaveLength(0)
  })
})

describe("POST /api/v1/admin/cleanup/test-data — test-pattern dry run", () => {
  it("defaults to dryRun=true when dryRun is omitted", async () => {
    const before = fakeDb.leads.length
    const res = await POST(makeRequest({ mode: "test-pattern" }))
    const body = await res.json()
    expect(body.dryRun).toBe(true)
    expect(fakeDb.leads.length).toBe(before)
  })

  it("returns matches + summary on dry run", async () => {
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: true }),
    )
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.matches).toBeDefined()
    expect(body.summary).toEqual({
      leads: fakeDb.leads.length,
      reservations: fakeDb.reservations.length,
      trade_in_quotes: fakeDb.trade_in_quotes.length,
    })
  })

  it("does not call delete on any table during dry run", async () => {
    await POST(makeRequest({ mode: "test-pattern", dryRun: true }))
    expect(fakeDb.leads).toHaveLength(3)
    expect(fakeDb.reservations).toHaveLength(2)
    expect(fakeDb.trade_in_quotes).toHaveLength(1)
  })
})

describe("POST /api/v1/admin/cleanup/test-data — test-pattern destructive run", () => {
  it("deletes all matched rows when dryRun=false", async () => {
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: false }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.dryRun).toBe(false)
    expect(body.deleted.leads).toBeGreaterThanOrEqual(2)
    expect(body.deleted.reservations).toBeGreaterThanOrEqual(1)
    expect(body.deleted.trade_in_quotes).toBeGreaterThanOrEqual(1)
  })

  it("omits errors[] when no failures", async () => {
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: false }),
    )
    const body = await res.json()
    expect(body.errors).toBeUndefined()
  })

  it("returns ok:false + errors[] when one table fails", async () => {
    fakeDeleteErrors.reservations = { message: "row policy denial" }
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: false }),
    )
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.errors).toBeInstanceOf(Array)
    expect(body.errors[0]).toContain("row policy")
    expect(body.deleted.leads).toBeGreaterThan(0)
  })

  it("continues across tables when one fails (no early exit)", async () => {
    fakeDeleteErrors.leads = { message: "leads exploded" }
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: false }),
    )
    const body = await res.json()
    expect(body.deleted.leads).toBe(0)
    expect(body.deleted.trade_in_quotes).toBeGreaterThan(0)
  })

  it("survives a select error on one table (returns empty matches for it)", async () => {
    fakeSelectErrors.trade_in_quotes = { message: "select failed" }
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: true }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.matches.trade_in_quotes).toEqual([])
  })

  it("skips empty id lists gracefully", async () => {
    fakeDb.leads = []
    fakeDb.reservations = []
    fakeDb.trade_in_quotes = []
    const res = await POST(
      makeRequest({ mode: "test-pattern", dryRun: false }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted).toEqual({ leads: 0, reservations: 0, trade_in_quotes: 0 })
  })
})
