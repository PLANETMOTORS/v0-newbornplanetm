import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

vi.mock("@/lib/csrf", () => ({ validateOrigin: vi.fn(() => true) }))
vi.mock("@/lib/redis", () => ({ rateLimit: vi.fn(async () => ({ success: true })) }))
vi.mock("@/lib/security/client-ip", () => ({ getClientIp: vi.fn(() => "127.0.0.1") }))
vi.mock("@/lib/meta-capi-helpers", () => ({ trackLead: vi.fn() }))
vi.mock("@/lib/email", () => ({ sendNotificationEmail: vi.fn(async () => undefined) }))
vi.mock("@/lib/adf/adapters", () => ({
  tradeInToAdfProspect: vi.fn(() => ({ provider: "ADF", payload: "stub" })),
}))
vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: vi.fn(async () => undefined),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const insertSpy = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({ insert: insertSpy }),
  })),
}))

const { POST } = await import("@/app/api/trade-in/quote/route")

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/trade-in/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  insertSpy.mockResolvedValue({ error: null })
})

describe("POST /api/trade-in/quote — happy path", () => {
  it("returns 200 with quoteId, vehicle, estimate envelope", async () => {
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.quoteId).toMatch(/^TQ-\d+-[A-F0-9]+$/)
    expect(body.data.vehicle).toMatchObject({
      year: 2020,
      make: "Toyota",
      model: "Corolla",
      mileage: 40000,
      condition: "good",
    })
    expect(body.data.estimate.currency).toBe("CAD")
  })

  it("inserts a row into trade_in_quotes with snake_case payload", async () => {
    await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
      }) as never,
    )
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const payload = insertSpy.mock.calls[0][0]
    expect(payload.vehicle_year).toBe(2020)
    expect(payload.vehicle_make).toBe("Toyota")
    expect(payload.status).toBe("pending")
    expect(payload.source).toBe("instant_quote")
  })

  it("includes vin in the response envelope when supplied", async () => {
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
        vin: "1HGBH41JXMN109186",
      }) as never,
    )
    const body = await res.json()
    expect(body.data.vehicle.vin).toBe("1HGBH41JXMN109186")
  })
})

describe("POST /api/trade-in/quote — validation", () => {
  it("returns 400 on malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/trade-in/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{",
      }) as never,
    )
    expect(res.status).toBe(400)
  })

  it("rejects 400 when required fields are missing", async () => {
    const res = await POST(makeReq({ year: 2020 }) as never)
    expect(res.status).toBe(400)
  })

  it("rejects 400 on bad condition", async () => {
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "shiny",
      }) as never,
    )
    expect(res.status).toBe(400)
  })

  it("returns a 400 with (root) prefix when the body is the wrong type", async () => {
    const res = await POST(makeReq([1, 2, 3]) as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toMatch(/\(root\)|Expected/)
  })
})

describe("POST /api/trade-in/quote — DB failure resilience", () => {
  it("still returns 200 with _persistWarning when DB insert fails", async () => {
    insertSpy.mockResolvedValueOnce({ error: { message: "DB exploded" } })
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
        customerEmail: "jane@example.com",
      }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data._persistWarning).toMatch(/database sync/i)
  })

  it("still returns 200 when client construction throws", async () => {
    insertSpy.mockImplementationOnce(() => {
      throw new Error("network down")
    })
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
      }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data._persistWarning).toBeDefined()
  })
})

describe("POST /api/trade-in/quote — side-effect failure resilience", () => {
  it("logs but does not fail the response when the email send rejects", async () => {
    const email = await import("@/lib/email")
    vi.mocked(email.sendNotificationEmail).mockRejectedValueOnce(new Error("smtp down"))
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
        customerEmail: "jane@example.com",
      }) as never,
    )
    expect(res.status).toBe(200)
    // Allow the unhandled .catch handler to run before the test exits.
    await new Promise((r) => setTimeout(r, 0))
    const { logger } = await import("@/lib/logger")
    expect(logger.error).toHaveBeenCalled()
  })

  it("logs but does not fail the response when ADF forward rejects", async () => {
    const adf = await import("@/lib/adf/forwarder")
    vi.mocked(adf.forwardLeadToAutoRaptor).mockRejectedValueOnce(new Error("smtp down"))
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
      }) as never,
    )
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 0))
  })
})

describe("POST /api/trade-in/quote — edge guards", () => {
  it("returns 403 when origin validation fails", async () => {
    const csrf = await import("@/lib/csrf")
    vi.mocked(csrf.validateOrigin).mockReturnValueOnce(false)
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
      }) as never,
    )
    expect(res.status).toBe(403)
  })

  it("returns 429 when rate limit is exceeded", async () => {
    const redis = await import("@/lib/redis")
    vi.mocked(redis.rateLimit).mockResolvedValueOnce({ success: false } as never)
    const res = await POST(
      makeReq({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        mileage: 40000,
        condition: "good",
      }) as never,
    )
    expect(res.status).toBe(429)
  })
})
