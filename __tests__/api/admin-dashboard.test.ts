import { describe, it, expect, vi, beforeEach } from "vitest"

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
  ADMIN_EMAILS: ["toni@planetmotors.ca"],
}))

interface ScenarioOptions {
  leadsTable?: Array<{
    id: string
    source: string
    status: string
    customer_name: string | null
    customer_email: string | null
    subject: string | null
    vehicle_info: string | null
    created_at: string
  }>
  finance?: Array<{
    id: string
    application_number: string
    status: string
    requested_amount: number
    created_at: string
  }>
  reservations?: Array<{
    id: string
    customer_name: string | null
    customer_email: string | null
    status: string
    deposit_amount: number
    deposit_status: string
    created_at: string
    vehicle_id?: string
  }>
  tradeIns?: Array<{
    id: string
    vehicle_year: string
    vehicle_make: string
    vehicle_model: string
    customer_name: string | null
    customer_email: string | null
    offer_amount: number
    status: string
    created_at: string
  }>
}

function makeFakeClient(scenario: ScenarioOptions = {}) {
  return {
    from: vi.fn((table: string) => {
      const dataFor: Record<string, unknown[] | undefined> = {
        leads: scenario.leadsTable,
        finance_applications_v2: scenario.finance,
        reservations: scenario.reservations,
        trade_in_quotes: scenario.tradeIns,
      }
      return {
        select: (
          _cols: string,
          options?: { count?: string; head?: boolean },
        ) => {
          if (options?.head) {
            const headPromise = {
              count: 0,
              data: null,
              error: null,
            }
            return {
              in: () => Promise.resolve(headPromise),
              eq: () => Promise.resolve(headPromise),
              gte: () => Promise.resolve(headPromise),
              then: (
                resolve: (v: typeof headPromise) => unknown,
              ) => resolve(headPromise),
            }
          }
          return {
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: dataFor[table] ?? [],
                  error: null,
                }),
            }),
          }
        },
      }
    }),
  }
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentUserEmail = "toni@planetmotors.ca"
})

async function loadRoute(scenario: ScenarioOptions) {
  const sb = await import("@supabase/supabase-js")
  ;(sb.createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
    makeFakeClient(scenario),
  )
  vi.resetModules()
  const mod = await import("@/app/api/v1/admin/dashboard/route")
  return mod.GET
}

describe("GET /api/v1/admin/dashboard — auth", () => {
  it("rejects 401 when no user", async () => {
    currentUserEmail = null
    const GET = await loadRoute({})
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("rejects 401 when user not admin", async () => {
    currentUserEmail = "stranger@example.com"
    const GET = await loadRoute({})
    const res = await GET()
    expect(res.status).toBe(401)
  })
})

describe("GET /api/v1/admin/dashboard — recent leads aggregation", () => {
  it("merges trade-ins, finance apps, and reservations into recentLeads when the leads table is empty", async () => {
    const GET = await loadRoute({
      leadsTable: [],
      finance: [
        {
          id: "f-1",
          application_number: "FA-001",
          status: "submitted",
          requested_amount: 50000,
          created_at: "2026-05-01T10:00:00Z",
        },
      ],
      reservations: [
        {
          id: "r-1",
          customer_name: "Alice",
          customer_email: "alice@x.com",
          status: "confirmed",
          deposit_amount: 50000,
          deposit_status: "paid",
          created_at: "2026-05-01T11:00:00Z",
        },
      ],
      tradeIns: [
        {
          id: "t-1",
          vehicle_year: "2020",
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
          customer_name: "Bob",
          customer_email: "bob@x.com",
          offer_amount: 15000,
          status: "pending",
          created_at: "2026-05-01T12:00:00Z",
        },
      ],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.recentLeads.length).toBe(3)
    const sources = body.recentLeads.map(
      (r: { source: string }) => r.source,
    )
    expect(sources).toContain("trade_in")
    expect(sources).toContain("finance_app")
    expect(sources).toContain("reservation")
  })

  it("sorts merged recent leads by created_at descending", async () => {
    const GET = await loadRoute({
      leadsTable: [],
      finance: [
        {
          id: "f-1",
          application_number: "FA-001",
          status: "submitted",
          requested_amount: 50000,
          created_at: "2026-05-01T08:00:00Z",
        },
      ],
      tradeIns: [
        {
          id: "t-1",
          vehicle_year: "2020",
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
          customer_name: "Bob",
          customer_email: "bob@x.com",
          offer_amount: 15000,
          status: "pending",
          created_at: "2026-05-01T15:00:00Z",
        },
      ],
    })
    const res = await GET()
    const body = await res.json()
    expect(body.recentLeads[0].id).toBe("t-1")
    expect(body.recentLeads[1].id).toBe("f-1")
  })

  it("dedupes ids that already exist in the leads table", async () => {
    const GET = await loadRoute({
      leadsTable: [
        {
          id: "shared-1",
          source: "manual",
          status: "new",
          customer_name: "Alice",
          customer_email: "alice@x.com",
          subject: "Manual entry",
          vehicle_info: null,
          created_at: "2026-05-01T10:00:00Z",
        },
      ],
      tradeIns: [
        {
          id: "shared-1",
          vehicle_year: "2020",
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
          customer_name: "Bob",
          customer_email: "bob@x.com",
          offer_amount: 15000,
          status: "pending",
          created_at: "2026-05-01T11:00:00Z",
        },
      ],
    })
    const res = await GET()
    const body = await res.json()
    const matching = body.recentLeads.filter(
      (r: { id: string }) => r.id === "shared-1",
    )
    expect(matching).toHaveLength(1)
    expect(matching[0].source).toBe("manual")
  })

  it("caps recent leads at 10 entries", async () => {
    const tradeIns = Array.from({ length: 15 }, (_, i) => ({
      id: `t-${i}`,
      vehicle_year: "2020",
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
      customer_name: `Bob ${i}`,
      customer_email: null,
      offer_amount: 1000 + i,
      status: "pending",
      created_at: new Date(2026, 4, 1, 12, i).toISOString(),
    }))
    const GET = await loadRoute({ leadsTable: [], tradeIns })
    const res = await GET()
    const body = await res.json()
    expect(body.recentLeads.length).toBeLessThanOrEqual(10)
  })

  it("returns empty recentLeads when no data sources have rows", async () => {
    const GET = await loadRoute({})
    const res = await GET()
    const body = await res.json()
    expect(body.recentLeads).toEqual([])
  })
})
