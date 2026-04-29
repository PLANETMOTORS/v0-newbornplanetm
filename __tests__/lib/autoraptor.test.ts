import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["AUTORAPTOR_ADF_ENDPOINT", "AUTORAPTOR_DEALER_ID", "AUTORAPTOR_DEALER_NAME"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.unstubAllGlobals()
})

const basePayload = {
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "555-1234",
  vehicleYear: 2024,
  vehicleMake: "Toyota",
  vehicleModel: "Camry",
  vehicleId: "v1",
  depositAmount: 50000, // $500.00
  stripeSessionId: "cs_test_123",
  source: "Stripe Checkout",
}

describe("createAutoRaptorLead", () => {
  it("returns success=false when AUTORAPTOR_ADF_ENDPOINT is missing", async () => {
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const result = await createAutoRaptorLead(basePayload)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/missing ADF endpoint/i)
  })

  it("posts ADF XML to the configured endpoint with correct headers", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    process.env.AUTORAPTOR_DEALER_ID = "DEALER-42"
    process.env.AUTORAPTOR_DEALER_NAME = "Test Dealer"
    const fetchMock = vi.fn(async () => new Response("LEAD-123", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const result = await createAutoRaptorLead(basePayload)
    expect(result.success).toBe(true)
    expect(result.leadId).toBe("LEAD-123")

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://crm.example.com/adf")
    expect(init?.method).toBe("POST")
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/xml")
    expect((init?.headers as Record<string, string>)["X-Dealer-ID"]).toBe("DEALER-42")
    const body = init?.body as string
    expect(body).toContain('<?xml version="1.0"')
    expect(body).toContain("<adf>")
    expect(body).toContain("Jane")
    expect(body).toContain("Doe")
    expect(body).toContain("jane@example.com")
    expect(body).toContain("Toyota")
    expect(body).toContain("Camry")
    expect(body).toContain("$500.00 CAD")
    expect(body).toContain("Test Dealer")
    expect(body).toContain("Stripe Checkout")
  })

  it("uses default dealer name when AUTORAPTOR_DEALER_NAME is unset", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead(basePayload)

    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).toContain("Planet Motors")
  })

  it("does NOT include X-Dealer-ID header when dealerId is missing", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead(basePayload)
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["X-Dealer-ID"]).toBeUndefined()
  })

  it("escapes XML-unsafe characters in customer fields", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({
      ...basePayload,
      customerName: 'Jane "Tess" & Co <Manager>',
      customerEmail: "jane'doe@x.com",
    })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).toContain("&amp;")
    expect(body).toContain("&lt;Manager&gt;")
    expect(body).toContain("&quot;Tess&quot;")
    expect(body).toContain("&apos;")
    // Raw < > & should not appear in user fields
    expect(body).not.toMatch(/Jane "Tess" &(?!amp;)/)
  })

  it("omits the vehicle block when vehicleYear is missing", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({ ...basePayload, vehicleYear: undefined })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).not.toContain("<vehicle ")
  })

  it("includes vehicle block but no <id> when vehicleId is missing", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({ ...basePayload, vehicleId: undefined })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).toContain("<vehicle ")
    expect(body).toContain("<year>2024</year>")
    expect(body).not.toContain('<id source="planetmotors.ca">v1</id>')
  })

  it("treats single-name customers as firstName + empty lastName", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({ ...basePayload, customerName: "Cher" })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).toContain('<name part="first">Cher</name>')
    expect(body).toContain('<name part="last"></name>')
  })

  it("includes phone block when phone is provided, omits when not", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({ ...basePayload, customerPhone: undefined })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).not.toContain('<phone type="voice">')

    fetchMock.mockClear()
    await createAutoRaptorLead({ ...basePayload, customerPhone: "555-1234" })
    const body2 = fetchMock.mock.calls[0][1]?.body as string
    expect(body2).toContain('<phone type="voice">555-1234</phone>')
  })

  it("returns error when response is not ok", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server kaboom", { status: 502 })),
    )
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/AutoRaptor ADF 502/)
    expect(r.error).toMatch(/server kaboom/)
  })

  it("handles unreadable response body on error", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const failingResponse = {
      ok: false,
      status: 500,
      text: async () => {
        throw new Error("bad body")
      },
    } as unknown as Response
    vi.stubGlobal("fetch", vi.fn(async () => failingResponse))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/No response body/)
  })

  it("returns success=true with no leadId when response body is empty", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(true)
    expect(r.leadId).toBeUndefined()
  })

  it("truncates very long success body to 100 chars", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const long = "X".repeat(500)
    vi.stubGlobal("fetch", vi.fn(async () => new Response(long, { status: 200 })))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(true)
    expect(r.leadId?.length).toBe(100)
  })

  it("handles Error throwables (network failure)", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED") }))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(false)
    expect(r.error).toBe("ECONNREFUSED")
  })

  it("handles non-Error throwables", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    vi.stubGlobal("fetch", vi.fn(async () => { throw "weird-error-shape" as unknown as Error }))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(false)
    expect(r.error).toBe("Unknown error")
  })

  it("handles unreadable success response body (text() throws)", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const oddResp = {
      ok: true,
      status: 200,
      text: async () => {
        throw new Error("read fail")
      },
    } as unknown as Response
    vi.stubGlobal("fetch", vi.fn(async () => oddResp))
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    const r = await createAutoRaptorLead(basePayload)
    expect(r.success).toBe(true)
    expect(r.leadId).toBeUndefined()
  })

  it("emits empty make/model elements when missing", async () => {
    process.env.AUTORAPTOR_ADF_ENDPOINT = "https://crm.example.com/adf"
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { createAutoRaptorLead } = await import("@/lib/autoraptor")
    await createAutoRaptorLead({
      ...basePayload,
      vehicleMake: undefined,
      vehicleModel: undefined,
    })
    const body = fetchMock.mock.calls[0][1]?.body as string
    expect(body).toContain("<make></make>")
    expect(body).toContain("<model></model>")
  })
})
