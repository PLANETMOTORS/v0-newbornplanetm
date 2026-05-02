import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

import {
  buildLeadRow,
  persistCaptureLead,
} from "@/lib/leads/capture/repository"
import type { CaptureLeadRequest } from "@/lib/leads/capture/schemas"

const REQ: CaptureLeadRequest = {
  firstName: "Tony",
  lastName: "Sultzberg",
  email: "tony@planetmotors.ca",
  phone: "+1 (416) 555-0102",
  annualIncome: 90000,
  requestedAmount: 35000,
  requestedTerm: 72,
}

describe("buildLeadRow", () => {
  it("composes the snake_case row with formatted subject and message", () => {
    const row = buildLeadRow(REQ)
    expect(row).toEqual({
      source: "finance_app",
      status: "new",
      priority: "high",
      customer_name: "Tony Sultzberg",
      customer_email: "tony@planetmotors.ca",
      customer_phone: "+1 (416) 555-0102",
      subject: "Finance Pre-Approval: $35,000 over 72 months",
      message:
        "Annual income: $90,000\nRequested amount: $35,000\nTerm: 72 months",
    })
  })
})

function makeClient(insertResult: { data?: unknown; error?: unknown }) {
  const single = vi.fn().mockResolvedValue(insertResult)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))
  const client = { from } as unknown as ReturnType<
    typeof import("@/lib/supabase/admin").createAdminClient
  >
  return { client, from, insert, select, single }
}

describe("persistCaptureLead — happy path", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns ok with the new row id", async () => {
    const m = makeClient({ data: { id: "lead-123" }, error: null })
    const result = await persistCaptureLead(REQ, () => m.client)
    expect(result.ok).toBe(true)
    expect(m.from).toHaveBeenCalledWith("leads")
    expect(m.insert).toHaveBeenCalledWith(buildLeadRow(REQ))
    expect(m.select).toHaveBeenCalledWith("id")
    if (result.ok) expect(result.value.id).toBe("lead-123")
  })
})

describe("persistCaptureLead — error channels", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns db-error when Supabase returns an error envelope", async () => {
    const m = makeClient({
      data: null,
      error: { message: "relation does not exist", code: "42P01" },
    })
    const result = await persistCaptureLead(REQ, () => m.client)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("db-error")
      expect(result.error.message).toBe("relation does not exist")
      if (result.error.kind === "db-error")
        expect(result.error.code).toBe("42P01")
    }
  })

  it("returns db-error when insert returns no row id", async () => {
    const m = makeClient({ data: null, error: null })
    const result = await persistCaptureLead(REQ, () => m.client)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("db-error")
      expect(result.error.message).toBe("insert returned no row id")
    }
  })

  it("returns exception when the client factory itself throws", async () => {
    const result = await persistCaptureLead(REQ, () => {
      throw new Error("boom")
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("exception")
      expect(result.error.message).toBe("boom")
    }
  })

  it("returns exception when the client factory throws a non-Error", async () => {
    const result = await persistCaptureLead(REQ, () => {
      throw "kaboom"
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("exception")
      expect(result.error.message).toBe("client init failed")
    }
  })

  it("returns exception when the insert call itself throws", async () => {
    const single = vi
      .fn()
      .mockRejectedValue(new Error("network down"))
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const client = {
      from: vi.fn(() => ({ insert })),
    } as unknown as ReturnType<
      typeof import("@/lib/supabase/admin").createAdminClient
    >
    const result = await persistCaptureLead(REQ, () => client)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("exception")
      expect(result.error.message).toBe("network down")
    }
  })

  it("returns exception with default message when insert throws non-Error", async () => {
    const single = vi.fn().mockRejectedValue("string-thrown")
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const client = {
      from: vi.fn(() => ({ insert })),
    } as unknown as ReturnType<
      typeof import("@/lib/supabase/admin").createAdminClient
    >
    const result = await persistCaptureLead(REQ, () => client)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe("exception")
      expect(result.error.message).toBe("insert threw")
    }
  })
})

describe("persistCaptureLead — default factory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uses the imported createAdminClient when no factory is provided", async () => {
    const mod = await import("@/lib/supabase/admin")
    const m = makeClient({ data: { id: "auto-1" }, error: null })
    vi.mocked(mod.createAdminClient).mockReturnValue(m.client)
    const result = await persistCaptureLead(REQ)
    expect(result.ok).toBe(true)
    expect(mod.createAdminClient).toHaveBeenCalledTimes(1)
  })
})
