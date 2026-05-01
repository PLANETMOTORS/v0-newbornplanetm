import { describe, it, expect, vi } from "vitest"
import {
  CRM_TABLES,
  deleteCrmRow,
} from "@/lib/admin/crm-delete/repository"

interface FakeOptions {
  data?: { id: string } | null
  error?: { message: string; code?: string } | null
  throws?: boolean
}

function fakeClient(opts: FakeOptions = {}) {
  return {
    from: vi.fn(() => ({
      delete: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if (opts.throws) throw new Error("boom")
              return {
                data: opts.error ? null : opts.data ?? null,
                error: opts.error ?? null,
              }
            },
          }),
        }),
      }),
    })),
  } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
}

describe("CRM_TABLES", () => {
  it("includes the four customer-facing tables", () => {
    expect(CRM_TABLES).toEqual([
      "leads",
      "finance_applications_v2",
      "reservations",
      "trade_in_quotes",
    ])
  })
})

describe("deleteCrmRow", () => {
  for (const table of CRM_TABLES) {
    describe(`table=${table}`, () => {
      it("returns ok with deleted id on success", async () => {
        const client = fakeClient({ data: { id: "row-1" } })
        const r = await deleteCrmRow(table, "row-1", () => client)
        expect(r.ok).toBe(true)
        if (r.ok) expect(r.value).toEqual({ id: "row-1" })
      })

      it("returns not-found when row missing", async () => {
        const client = fakeClient({ data: null })
        const r = await deleteCrmRow(table, "missing", () => client)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe("not-found")
      })

      it("returns db-error on supabase error with code", async () => {
        const client = fakeClient({ error: { message: "rls", code: "42501" } })
        const r = await deleteCrmRow(table, "x", () => client)
        expect(r.ok).toBe(false)
        if (!r.ok) {
          expect(r.error.kind).toBe("db-error")
          if (r.error.kind === "db-error") {
            expect(r.error.message).toBe("rls")
            expect(r.error.code).toBe("42501")
          }
        }
      })

      it("returns db-error without code when supabase omits it", async () => {
        const client = fakeClient({ error: { message: "boom" } })
        const r = await deleteCrmRow(table, "x", () => client)
        expect(r.ok).toBe(false)
        if (!r.ok && r.error.kind === "db-error") {
          expect(r.error.code).toBeUndefined()
        }
      })

      it("returns exception kind when client throws", async () => {
        const client = fakeClient({ throws: true })
        const r = await deleteCrmRow(table, "x", () => client)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe("exception")
      })
    })
  }

  it("normalises non-Error throws to a string message", async () => {
    const client = {
      from: () => ({
        delete: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => {
                throw "raw string" as unknown as Error
              },
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
    const r = await deleteCrmRow("leads", "x", () => client)
    expect(r.ok).toBe(false)
    if (!r.ok && r.error.kind === "exception") {
      expect(r.error.message).toBe("unknown error")
    }
  })
})
