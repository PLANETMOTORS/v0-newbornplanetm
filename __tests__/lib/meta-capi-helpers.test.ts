import { describe, it, expect, vi, beforeEach } from "vitest"

const sendMetaEventMock = vi.fn()

vi.mock("@/lib/meta-capi", () => ({
  sendMetaEvent: (...args: unknown[]) => sendMetaEventMock(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/track", {
    method: "POST",
    headers,
  })
}

describe("extractRequestContext", () => {
  it("extracts IP from x-forwarded-for", async () => {
    const { extractRequestContext } = await import("@/lib/meta-capi-helpers")
    const ctx = extractRequestContext(
      makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
    )
    expect(ctx.clientIp).toBe("1.2.3.4")
  })

  it("extracts user-agent and referer", async () => {
    const { extractRequestContext } = await import("@/lib/meta-capi-helpers")
    const ctx = extractRequestContext(
      makeRequest({
        "user-agent": "Mozilla/5.0",
        referer: "https://planetmotors.ca/used-cars",
      })
    )
    expect(ctx.userAgent).toBe("Mozilla/5.0")
    expect(ctx.referer).toBe("https://planetmotors.ca/used-cars")
  })

  it("extracts _fbc and _fbp from cookie header", async () => {
    const { extractRequestContext } = await import("@/lib/meta-capi-helpers")
    const ctx = extractRequestContext(
      makeRequest({ cookie: "_fbc=fb.1.123; _fbp=fb.1.456" })
    )
    expect(ctx.fbc).toBe("fb.1.123")
    expect(ctx.fbp).toBe("fb.1.456")
  })
})

describe("trackLead", () => {
  it("fires a Lead event with correct data", async () => {
    sendMetaEventMock.mockResolvedValue({ success: true })
    const { trackLead } = await import("@/lib/meta-capi-helpers")
    trackLead(makeRequest({ "user-agent": "test" }), {
      email: "jane@example.com",
      firstName: "Jane",
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(sendMetaEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "Lead",
        userData: expect.objectContaining({
          email: "jane@example.com",
          firstName: "Jane",
        }),
      })
    )
  })
})

describe("fireEvent — fire-and-forget error handling", () => {
  it("logs error when sendMetaEvent rejects (does not throw)", async () => {
    sendMetaEventMock.mockRejectedValueOnce(new Error("network error"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { trackLead } = await import("@/lib/meta-capi-helpers")
    trackLead(makeRequest(), { email: "x@y.com" })
    await new Promise((r) => setTimeout(r, 50))
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Meta CAPI] Failed to send Lead:"),
      expect.any(Error),
    )
    errSpy.mockRestore()
  })
})
