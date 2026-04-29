import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createHash } from "node:crypto"

const ENV_KEYS = ["NEXT_PUBLIC_META_PIXEL_ID", "META_CAPI_ACCESS_TOKEN", "NODE_ENV"] as const
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
  vi.restoreAllMocks()
})

const sha = (s: string) => createHash("sha256").update(s).digest("hex")

describe("sendMetaEvent — env gating", () => {
  it("returns success=false with descriptive error when PIXEL_ID is missing", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "tok"
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(r.error).toBe("Meta CAPI not configured")
  })

  it("returns success=false when ACCESS_TOKEN is missing", async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "px"
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(r.error).toBe("Meta CAPI not configured")
  })

  it("logs in development when env vars are missing", async () => {
    process.env.NODE_ENV = "development"
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({ eventName: "Lead" })
    expect(infoSpy).toHaveBeenCalledWith("[Meta CAPI] Skipped — missing PIXEL_ID or ACCESS_TOKEN")
  })

  it("does NOT log in production when env vars are missing", async () => {
    process.env.NODE_ENV = "production"
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({ eventName: "Lead" })
    expect(infoSpy).not.toHaveBeenCalled()
  })
})

describe("sendMetaEvent — happy path", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "PIXEL123"
    process.env.META_CAPI_ACCESS_TOKEN = "tok-123"
  })

  it("posts to graph.facebook.com with correct URL and shape", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const result = await sendMetaEvent({ eventName: "Lead" })
    expect(result.success).toBe(true)
    expect(result.eventsReceived).toBe(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/graph\.facebook\.com\/v21\.0\/PIXEL123\/events/)
    expect(String(url)).toMatch(/access_token=tok-123/)
    expect(init?.method).toBe("POST")
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
    const body = JSON.parse(init?.body as string)
    expect(body.data[0].event_name).toBe("Lead")
    expect(body.data[0].action_source).toBe("website")
    expect(typeof body.data[0].event_time).toBe("number")
  })

  it("respects supplied eventTime, eventSourceUrl, actionSource", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({
      eventName: "Purchase",
      eventTime: 1700000000,
      eventSourceUrl: "https://example.com/checkout",
      actionSource: "email",
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.data[0].event_time).toBe(1700000000)
    expect(body.data[0].event_source_url).toBe("https://example.com/checkout")
    expect(body.data[0].action_source).toBe("email")
    expect(body.data[0].event_name).toBe("Purchase")
  })

  it("hashes user PII (email, phone, name, city, state, postal code, country)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({
      eventName: "Lead",
      userData: {
        email: " Jane@Example.COM ",
        phone: "(416) 555-1234",
        firstName: "Jane",
        lastName: "Doe",
        city: "Toronto",
        state: "ON",
        postalCode: "M5V 3A1",
        country: "CA",
        clientIpAddress: "1.2.3.4",
        clientUserAgent: "Mozilla",
        fbc: "fb.1.foo",
        fbp: "fb.1.bar",
      },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    const ud = body.data[0].user_data
    expect(ud.em).toEqual([sha("jane@example.com")])
    expect(ud.ph).toEqual([sha("4165551234")])
    expect(ud.fn).toBe(sha("jane"))
    expect(ud.ln).toBe(sha("doe"))
    expect(ud.ct).toBe(sha("toronto"))
    expect(ud.st).toBe(sha("on"))
    expect(ud.zp).toBe(sha("m5v3a1"))
    expect(ud.country).toBe(sha("ca"))
    expect(ud.client_ip_address).toBe("1.2.3.4")
    expect(ud.client_user_agent).toBe("Mozilla")
    expect(ud.fbc).toBe("fb.1.foo")
    expect(ud.fbp).toBe("fb.1.bar")
  })

  it("defaults country to 'ca' when missing", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({
      eventName: "Lead",
      userData: { email: "x@y.com" },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.data[0].user_data.country).toBe(sha("ca"))
  })

  it("returns null entry for whitespace-only PII fields (post-JSON-roundtrip)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({
      eventName: "Lead",
      userData: { email: "   ", firstName: "" },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    // Email was non-empty pre-trim, so [null] is emitted; firstName was empty so it is missing entirely.
    expect(body.data[0].user_data.em).toEqual([null])
    expect(body.data[0].user_data.fn).toBeUndefined()
  })

  it("omits user_data block entirely when no userData was supplied", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({ eventName: "ViewContent" })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.data[0].user_data).toBeUndefined()
  })

  it("forwards customData as custom_data", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    await sendMetaEvent({
      eventName: "Purchase",
      customData: {
        value: 250,
        currency: "CAD",
        contentName: "Vehicle Reservation",
      },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body.data[0].custom_data).toEqual({
      value: 250,
      currency: "CAD",
      contentName: "Vehicle Reservation",
    })
  })
})

describe("sendMetaEvent — error handling", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "PIXEL123"
    process.env.META_CAPI_ACCESS_TOKEN = "tok-123"
  })

  it("returns failure when API responds with non-OK", async () => {
    const errorBody = { error: { message: "Invalid token" } }
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(errorBody), { status: 401 })))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(r.error).toBe("Invalid token")
    expect(errSpy).toHaveBeenCalledWith("[Meta CAPI] Error:", "Invalid token")
  })

  it("returns 'API error' when error.message is absent", async () => {
    const errorBody = { error: {} }
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(errorBody), { status: 500 })))
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(r.error).toBe("API error")
  })

  it("falls back to JSON.stringify(data) when error object is missing entirely", async () => {
    const errorBody = { something: "else" }
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(errorBody), { status: 500 })))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(errSpy).toHaveBeenCalledWith(
      "[Meta CAPI] Error:",
      expect.stringContaining("something"),
    )
  })

  it("returns 'Network error' when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("DNS down") }))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendMetaEvent } = await import("@/lib/meta-capi")
    const r = await sendMetaEvent({ eventName: "Lead" })
    expect(r.success).toBe(false)
    expect(r.error).toBe("Network error")
    expect(errSpy).toHaveBeenCalledWith("[Meta CAPI] Network error:", expect.any(Error))
  })
})
