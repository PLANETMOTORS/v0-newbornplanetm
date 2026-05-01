import { describe, it, expect, vi } from "vitest"
import {
  deactivateAdmin,
  deleteAdmin,
  getAdminByEmail,
  inviteAdmin,
  isActiveAdmin,
  listAdmins,
  updateAdmin,
} from "@/lib/admin/users/repository"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

interface BehaviourOptions {
  selectError?: { message: string; code?: string } | null
  selectData?: unknown
  insertError?: { message: string; code?: string } | null
  insertData?: unknown
  updateError?: { message: string; code?: string } | null
  updateData?: unknown
  deleteError?: { message: string; code?: string } | null
  deleteData?: unknown
  throwOn?: "select" | "insert" | "update" | "delete" | null
}

function fakeClient(opts: BehaviourOptions = {}) {
  const selectChain = {
    order: vi.fn(async () => {
      if (opts.throwOn === "select") throw new Error("select threw")
      return {
        data: opts.selectError ? null : opts.selectData ?? [],
        error: opts.selectError ?? null,
      }
    }),
    eq: () => ({
      maybeSingle: async () => {
        if (opts.throwOn === "select") throw new Error("select threw")
        return {
          data: opts.selectError ? null : (opts.selectData as unknown),
          error: opts.selectError ?? null,
        }
      },
    }),
  }
  return {
    from: () => ({
      select: () => selectChain,
      insert: () => ({
        select: () => ({
          single: async () => {
            if (opts.throwOn === "insert") throw new Error("insert threw")
            return {
              data: opts.insertError ? null : opts.insertData,
              error: opts.insertError ?? null,
            }
          },
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if (opts.throwOn === "update") throw new Error("update threw")
              return {
                data: opts.updateError ? null : opts.updateData,
                error: opts.updateError ?? null,
              }
            },
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if (opts.throwOn === "delete") throw new Error("delete threw")
              return {
                data: opts.deleteError ? null : opts.deleteData,
                error: opts.deleteError ?? null,
              }
            },
          }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
}

const SAMPLE_ROW = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "toni@planetmotors.ca",
  role: "admin",
  is_active: true,
  invited_by: null,
  notes: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}

describe("listAdmins", () => {
  it("returns the rows on success", async () => {
    const client = fakeClient({ selectData: [SAMPLE_ROW] })
    const r = await listAdmins(() => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual([SAMPLE_ROW])
  })

  it("returns empty array when select returns null data", async () => {
    const client = fakeClient({ selectData: null })
    const r = await listAdmins(() => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual([])
  })

  it("returns db-error when select fails", async () => {
    const client = fakeClient({ selectError: { message: "rls", code: "42501" } })
    const r = await listAdmins(() => client)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("db-error")
      if (r.error.kind === "db-error") {
        expect(r.error.message).toBe("rls")
        expect(r.error.code).toBe("42501")
      }
    }
  })

  it("returns exception kind on thrown error", async () => {
    const client = fakeClient({ throwOn: "select" })
    const r = await listAdmins(() => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})

describe("getAdminByEmail", () => {
  it("returns the row when found", async () => {
    const client = fakeClient({ selectData: SAMPLE_ROW })
    const r = await getAdminByEmail("toni@planetmotors.ca", () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual(SAMPLE_ROW)
  })

  it("returns null when not found", async () => {
    const client = fakeClient({ selectData: null })
    const r = await getAdminByEmail("missing@x.com", () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBeNull()
  })

  it("returns db-error on select failure", async () => {
    const client = fakeClient({ selectError: { message: "boom" } })
    const r = await getAdminByEmail("a@b.com", () => client)
    expect(r.ok).toBe(false)
  })

  it("normalises email casing", async () => {
    const client = fakeClient({ selectData: SAMPLE_ROW })
    const r = await getAdminByEmail("TONI@PLANETMOTORS.CA", () => client)
    expect(r.ok).toBe(true)
  })

  it("returns exception kind on thrown error", async () => {
    const client = fakeClient({ throwOn: "select" })
    const r = await getAdminByEmail("a@b.com", () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})

describe("isActiveAdmin", () => {
  it("returns true for an active admin row", async () => {
    const client = fakeClient({ selectData: SAMPLE_ROW })
    expect(await isActiveAdmin("toni@planetmotors.ca", () => client)).toBe(true)
  })

  it("returns false when row is inactive", async () => {
    const client = fakeClient({ selectData: { ...SAMPLE_ROW, is_active: false } })
    expect(await isActiveAdmin("toni@planetmotors.ca", () => client)).toBe(false)
  })

  it("returns false when no row found", async () => {
    const client = fakeClient({ selectData: null })
    expect(await isActiveAdmin("ghost@x.com", () => client)).toBe(false)
  })

  it("returns false when select errors", async () => {
    const client = fakeClient({ selectError: { message: "boom" } })
    expect(await isActiveAdmin("a@b.com", () => client)).toBe(false)
  })
})

describe("inviteAdmin", () => {
  it("returns the row on success", async () => {
    const client = fakeClient({ insertData: SAMPLE_ROW })
    const r = await inviteAdmin(
      { email: "toni@planetmotors.ca", role: "admin" },
      null,
      () => client,
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual(SAMPLE_ROW)
  })

  it("maps unique-violation to duplicate-email kind", async () => {
    const client = fakeClient({
      insertError: { message: "duplicate key", code: "23505" },
    })
    const r = await inviteAdmin(
      { email: "toni@planetmotors.ca", role: "admin" },
      null,
      () => client,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("duplicate-email")
      if (r.error.kind === "duplicate-email") {
        expect(r.error.email).toBe("toni@planetmotors.ca")
      }
    }
  })

  it("maps non-unique db errors to db-error kind", async () => {
    const client = fakeClient({
      insertError: { message: "schema mismatch", code: "42P01" },
    })
    const r = await inviteAdmin(
      { email: "a@b.com", role: "admin" },
      null,
      () => client,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("db-error")
  })

  it("returns db-error when no error and no row returned", async () => {
    const client = fakeClient({ insertData: null })
    const r = await inviteAdmin(
      { email: "a@b.com", role: "admin" },
      null,
      () => client,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("db-error")
  })

  it("returns exception kind on thrown error", async () => {
    const client = fakeClient({ throwOn: "insert" })
    const r = await inviteAdmin(
      { email: "a@b.com", role: "admin" },
      null,
      () => client,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})

describe("updateAdmin", () => {
  it("returns the updated row on success", async () => {
    const client = fakeClient({ updateData: { ...SAMPLE_ROW, role: "manager" } })
    const r = await updateAdmin(SAMPLE_ROW.id, { role: "manager" }, () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.role).toBe("manager")
  })

  it("returns not-found when no row updated", async () => {
    const client = fakeClient({ updateData: null })
    const r = await updateAdmin(SAMPLE_ROW.id, { role: "viewer" }, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("not-found")
  })

  it("returns db-error on update failure", async () => {
    const client = fakeClient({ updateError: { message: "rls", code: "42501" } })
    const r = await updateAdmin(SAMPLE_ROW.id, { role: "admin" }, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("db-error")
  })

  it("returns exception kind when update throws", async () => {
    const client = fakeClient({ throwOn: "update" })
    const r = await updateAdmin(SAMPLE_ROW.id, { role: "admin" }, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })

  it("supports an is_active-only patch", async () => {
    const client = fakeClient({ updateData: { ...SAMPLE_ROW, is_active: false } })
    const r = await updateAdmin(SAMPLE_ROW.id, { is_active: false }, () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.is_active).toBe(false)
  })

  it("supports a notes:null patch", async () => {
    const client = fakeClient({ updateData: { ...SAMPLE_ROW, notes: null } })
    const r = await updateAdmin(SAMPLE_ROW.id, { notes: null }, () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.notes).toBeNull()
  })
})

describe("deactivateAdmin", () => {
  it("delegates to updateAdmin with is_active=false", async () => {
    const client = fakeClient({ updateData: { ...SAMPLE_ROW, is_active: false } })
    const r = await deactivateAdmin(SAMPLE_ROW.id, () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.is_active).toBe(false)
  })
})

describe("deleteAdmin", () => {
  it("returns the deleted id on success", async () => {
    const client = fakeClient({ deleteData: { id: SAMPLE_ROW.id } })
    const r = await deleteAdmin(SAMPLE_ROW.id, () => client)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.id).toBe(SAMPLE_ROW.id)
  })

  it("returns not-found when row does not exist", async () => {
    const client = fakeClient({ deleteData: null })
    const r = await deleteAdmin(SAMPLE_ROW.id, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("not-found")
  })

  it("returns db-error on delete failure", async () => {
    const client = fakeClient({ deleteError: { message: "boom" } })
    const r = await deleteAdmin(SAMPLE_ROW.id, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("db-error")
  })

  it("returns exception kind when delete throws", async () => {
    const client = fakeClient({ throwOn: "delete" })
    const r = await deleteAdmin(SAMPLE_ROW.id, () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})
