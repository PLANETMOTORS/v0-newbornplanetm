import { describe, it, expect, vi } from "vitest"
import {
  deleteAllMatches,
  deleteByIds,
  findTestRows,
  summarise,
} from "@/lib/admin/cleanup/repository"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

interface FakeOptions {
  selectError?: { message: string } | null
  deleteError?: { message: string } | null
  selectData?: Array<{ id: string; customer_name?: string | null; customer_email?: string | null }>
  deleteThrows?: boolean
  deleteCount?: number
}

function fakeClient(perTable: Record<string, FakeOptions> = {}) {
  return {
    from: (table: string) => {
      const opts = perTable[table] ?? {}
      return {
        select: () => ({
          or: async () => ({
            data: opts.selectError ? null : opts.selectData ?? [],
            error: opts.selectError ?? null,
          }),
        }),
        delete: () => ({
          in: async () => {
            if (opts.deleteThrows) throw new Error(`${table} delete blew up`)
            return {
              error: opts.deleteError ?? null,
              count: opts.deleteError ? null : opts.deleteCount ?? 0,
            }
          },
        }),
      }
    },
  } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
}

describe("findTestRows", () => {
  it("returns empty arrays when no tables match anything", async () => {
    const client = fakeClient()
    const r = await findTestRows(() => client)
    expect(r.leads).toEqual([])
    expect(r.reservations).toEqual([])
    expect(r.trade_in_quotes).toEqual([])
  })

  it("returns matched rows per table", async () => {
    const client = fakeClient({
      leads: { selectData: [{ id: "l-1", customer_name: "Devin Test" }] },
      reservations: { selectData: [{ id: "r-1" }] },
      trade_in_quotes: { selectData: [{ id: "t-1" }, { id: "t-2" }] },
    })
    const r = await findTestRows(() => client)
    expect(r.leads).toHaveLength(1)
    expect(r.reservations).toHaveLength(1)
    expect(r.trade_in_quotes).toHaveLength(2)
  })

  it("treats null data with no error as an empty match list", async () => {
    const client = {
      from: () => ({
        select: () => ({
          or: async () => ({ data: null, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
    const r = await findTestRows(() => client)
    expect(r.leads).toEqual([])
    expect(r.reservations).toEqual([])
    expect(r.trade_in_quotes).toEqual([])
  })

  it("degrades to empty array on a per-table select error", async () => {
    const client = fakeClient({
      leads: { selectError: { message: "rls denied" } },
      reservations: { selectData: [{ id: "r-1" }] },
    })
    const r = await findTestRows(() => client)
    expect(r.leads).toEqual([])
    expect(r.reservations).toHaveLength(1)
  })
})

describe("deleteByIds", () => {
  it("returns ok(0) without invoking the client when ids is empty", async () => {
    const client = fakeClient({})
    const spy = vi.spyOn(client, "from")
    const r = await deleteByIds("leads", [], () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(0)
    expect(spy).not.toHaveBeenCalled()
  })

  it("returns ok with count when delete succeeds", async () => {
    const client = fakeClient({ leads: { deleteCount: 3 } })
    const r = await deleteByIds("leads", ["a", "b", "c"], () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(3)
  })

  it("returns ok(0) when supabase returns count=null", async () => {
    const client = {
      from: () => ({
        delete: () => ({
          in: async () => ({ error: null, count: null }),
        }),
      }),
    } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
    const r = await deleteByIds("leads", ["a"], () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(0)
  })

  it("returns err with table-prefixed message on db error", async () => {
    const client = fakeClient({ leads: { deleteError: { message: "constraint" } } })
    const r = await deleteByIds("leads", ["a"], () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("leads: constraint")
  })

  it("captures thrown exceptions and reports them as err", async () => {
    const client = fakeClient({ leads: { deleteThrows: true } })
    const r = await deleteByIds("leads", ["a"], () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("leads: leads delete blew up")
  })

  it("normalises non-Error throws from the delete call", async () => {
    const client = {
      from: () => ({
        delete: () => ({
          in: async () => {
            throw "raw string from delete" as unknown as Error
          },
        }),
      }),
    } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
    const r = await deleteByIds("leads", ["a"], () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("leads:")
  })
})

describe("deleteAllMatches", () => {
  it("deletes from every table that has matches", async () => {
    const client = fakeClient({
      leads: { deleteCount: 2 },
      reservations: { deleteCount: 1 },
      trade_in_quotes: { deleteCount: 4 },
    })
    const matches = {
      leads: [{ id: "l-1" }, { id: "l-2" }],
      reservations: [{ id: "r-1" }],
      trade_in_quotes: [{ id: "t-1" }, { id: "t-2" }, { id: "t-3" }, { id: "t-4" }],
    }
    const r = await deleteAllMatches(matches, () => client)
    expect(r.deleted).toEqual({ leads: 2, reservations: 1, trade_in_quotes: 4 })
    expect(r.errors).toEqual([])
  })

  it("continues across tables when one fails", async () => {
    const client = fakeClient({
      leads: { deleteError: { message: "boom" } },
      reservations: { deleteCount: 1 },
      trade_in_quotes: { deleteCount: 1 },
    })
    const r = await deleteAllMatches(
      {
        leads: [{ id: "l-1" }],
        reservations: [{ id: "r-1" }],
        trade_in_quotes: [{ id: "t-1" }],
      },
      () => client,
    )
    expect(r.deleted.leads).toBe(0)
    expect(r.deleted.reservations).toBe(1)
    expect(r.deleted.trade_in_quotes).toBe(1)
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]).toContain("leads: boom")
  })

  it("skips tables with empty match lists", async () => {
    const client = fakeClient({})
    const r = await deleteAllMatches(
      { leads: [], reservations: [], trade_in_quotes: [] },
      () => client,
    )
    expect(r.deleted).toEqual({ leads: 0, reservations: 0, trade_in_quotes: 0 })
    expect(r.errors).toEqual([])
  })
})

describe("summarise", () => {
  it("returns per-table counts", () => {
    const r = summarise({
      leads: [{ id: "1" }, { id: "2" }],
      reservations: [],
      trade_in_quotes: [{ id: "x" }],
    })
    expect(r).toEqual({ leads: 2, reservations: 0, trade_in_quotes: 1 })
  })
})
