import { describe, it, expect, vi, beforeEach } from "vitest"
import { sendNotificationEmail } from "@/lib/email"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

// Capture the insert payload so we can assert on it
let capturedInsert: Record<string, unknown> | null = null
let mockInsertError: { message: string } | null = null

const mockInsert = vi.fn(async (payload: Record<string, unknown>) => {
  capturedInsert = payload
  return { error: mockInsertError }
})
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn(async () => undefined),
}))

vi.mock("@/lib/csrf", () => ({
  validateOrigin: vi.fn(() => true),
}))

vi.mock("@/lib/redis", () => ({
  rateLimit: vi.fn(async () => ({ success: true })),
}))

vi.mock("@/lib/security/client-ip", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}))

vi.mock("@/lib/meta-capi-helpers", () => ({
  trackLead: vi.fn(),
}))

vi.mock("@/lib/adf/adapters", () => ({
  tradeInToAdfProspect: vi.fn(() => ({})),
}))

vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: vi.fn(async () => ({ ok: true })),
}))

const { POST } = await import("@/app/api/trade-in/quote/route")

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/trade-in/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  })
}

const validBody = {
  year: 2008,
  make: "BMW",
  model: "M5",
  mileage: 120000,
  condition: "good",
  vin: "WBSNB93508CX12345",
  customerName: "Jenny Iagoudakis",
  customerEmail: "jenny@example.com",
  customerPhone: "4166525118",
}

describe("POST /api/trade-in/quote — persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedInsert = null
    mockInsertError = null
  })

  it("persists the quote to trade_in_quotes table", async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith("trade_in_quotes")
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it("inserts a row that includes all customer + vehicle + offer fields", async () => {
    await POST(makeRequest(validBody))
    expect(capturedInsert).toBeTruthy()
    if (!capturedInsert) throw new Error("insert payload not captured")
    const row = capturedInsert
    expect(row.vehicle_year).toBe(2008)
    expect(row.vehicle_make).toBe("BMW")
    expect(row.vehicle_model).toBe("M5")
    expect(row.mileage).toBe(120000)
    expect(row.condition).toBe("good")
    expect(row.vin).toBe("WBSNB93508CX12345")
    expect(row.customer_name).toBe("Jenny Iagoudakis")
    expect(row.customer_email).toBe("jenny@example.com")
    expect(row.customer_phone).toBe("4166525118")
    expect(row.status).toBe("pending")
    expect(row.source).toBe("instant_quote")
    expect(typeof row.quote_id).toBe("string")
    expect(row.quote_id).toMatch(/^TQ-\d+-[A-F0-9]+$/)
    expect(typeof row.offer_amount).toBe("number")
    expect(typeof row.offer_low).toBe("number")
    expect(typeof row.offer_high).toBe("number")
    expect(row.offer_low).toBeLessThanOrEqual(row.offer_amount as number)
    expect(row.offer_high).toBeGreaterThanOrEqual(row.offer_amount as number)
    expect(typeof row.valid_until).toBe("string")
  })

  it("still returns 200 + emails the dealer when DB persist fails (no lead loss)", async () => {
    mockInsertError = { message: "DB exploded" }
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.quoteId).toMatch(/^TQ-/)
    // DB error is surfaced as a sanitized warning (not the raw error message) so
    // internal Postgres details are never leaked to the customer-facing response.
    expect(body.data._persistWarning).toBeDefined()
    // Dealer email must still fire — this is the "no lead loss" guarantee.
    expect(vi.mocked(sendNotificationEmail)).toHaveBeenCalledOnce()
  })

  it("rejects missing required fields with 400", async () => {
    const { year: _y, ...incomplete } = validBody
    void _y
    const res = await POST(makeRequest(incomplete))
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("rejects non-numeric year or mileage with 400", async () => {
    const res = await POST(makeRequest({ ...validBody, year: "not-a-year" }))
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("uses null for missing optional fields rather than undefined", async () => {
    await POST(makeRequest({
      year: 2020,
      make: "Toyota",
      model: "Camry",
      mileage: 50000,
      condition: "good",
    }))
    if (!capturedInsert) throw new Error("insert payload not captured")
    expect(capturedInsert.vin).toBeNull()
    expect(capturedInsert.customer_name).toBeNull()
    expect(capturedInsert.customer_email).toBeNull()
    expect(capturedInsert.customer_phone).toBeNull()
  })
})
