import { describe, it, expect, vi } from "vitest"
import { persistTradeInQuote, type TradeInQuoteRow } from "@/lib/trade-in/repository"

function makeRow(overrides: Partial<TradeInQuoteRow> = {}): TradeInQuoteRow {
  return {
    quoteId: "TQ-1-AAA",
    vehicleYear: 2020,
    vehicleMake: "Toyota",
    vehicleModel: "Corolla",
    mileage: 40000,
    condition: "good",
    vin: null,
    customerName: null,
    customerEmail: null,
    customerPhone: null,
    offerAmount: 12000,
    offerLow: 10000,
    offerHigh: 14000,
    status: "pending",
    validUntil: "2026-05-01T00:00:00.000Z",
    source: "instant_quote",
    ...overrides,
  }
}

function fakeClient(insertResult: { error: { message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult)
  const from = vi.fn().mockReturnValue({ insert })
  return { client: { from } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, insert, from }
}

describe("persistTradeInQuote", () => {
  it("returns ok on a successful insert", async () => {
    const { client } = fakeClient({ error: null })
    const r = await persistTradeInQuote(makeRow(), () => client)
    expect(r.ok).toBe(true)
  })

  it("translates row fields to snake_case payload", async () => {
    const { client, insert, from } = fakeClient({ error: null })
    const row = makeRow({ vin: "1HGBH41JXMN109186", customerEmail: "x@y.ca" })
    await persistTradeInQuote(row, () => client)
    expect(from).toHaveBeenCalledWith("trade_in_quotes")
    const payload = insert.mock.calls[0][0]
    expect(payload.quote_id).toBe(row.quoteId)
    expect(payload.vehicle_year).toBe(row.vehicleYear)
    expect(payload.vehicle_make).toBe(row.vehicleMake)
    expect(payload.vehicle_model).toBe(row.vehicleModel)
    expect(payload.vin).toBe(row.vin)
    expect(payload.customer_email).toBe(row.customerEmail)
    expect(payload.offer_amount).toBe(row.offerAmount)
    expect(payload.valid_until).toBe(row.validUntil)
    expect(payload.source).toBe(row.source)
  })

  it("returns db-error when supabase reports an insert error", async () => {
    const { client } = fakeClient({ error: { message: "FK violation" } })
    const r = await persistTradeInQuote(makeRow(), () => client)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("db-error")
      expect(r.error.message).toContain("FK violation")
    }
  })

  it("returns exception when the insert call itself throws", async () => {
    const insert = vi.fn().mockImplementation(() => {
      throw new Error("network down")
    })
    const fakeFrom = vi.fn().mockReturnValue({ insert })
    const r = await persistTradeInQuote(makeRow(), () =>
      ({ from: fakeFrom } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("exception")
      expect(r.error.message).toContain("network down")
    }
  })

  it("returns exception when client construction itself throws", async () => {
    const r = await persistTradeInQuote(makeRow(), () => {
      throw new Error("missing service role key")
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("exception")
      expect(r.error.message).toContain("service role key")
    }
  })

  it("normalises non-Error throws from client construction", async () => {
    const r = await persistTradeInQuote(makeRow(), () => {
      throw "raw client init failure" as unknown as Error
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("exception")
    }
  })

  it("normalises non-Error throws to a string message", async () => {
    const insert = vi.fn().mockImplementation(() => {
      throw "raw string" as unknown as Error
    })
    const fakeFrom = vi.fn().mockReturnValue({ insert })
    const r = await persistTradeInQuote(makeRow(), () =>
      ({ from: fakeFrom } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("exception")
    }
  })
})
