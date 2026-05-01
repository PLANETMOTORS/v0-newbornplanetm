import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

vi.mock("@/lib/csrf", () => ({ validateOrigin: vi.fn(() => true) }))
vi.mock("@/lib/redis", () => ({
  rateLimit: vi.fn(async () => ({ success: true })),
}))
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn(async () => undefined),
}))
vi.mock("@/lib/adf/adapters", () => ({
  financeToAdfProspect: vi.fn(() => ({ provider: "ADF", payload: "stub" })),
}))
vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: vi.fn(async () => undefined),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const persistSpy = vi.fn()
vi.mock("@/lib/leads/capture/repository", () => ({
  persistCaptureLead: persistSpy,
}))

const { POST } = await import("@/app/api/v1/financing/capture-lead/route")

const VALID_BODY = {
  firstName: "Tony",
  lastName: "Sultzberg",
  email: "tony@planetmotors.ca",
  phone: "+1 (416) 555-0102",
  annualIncome: 90000,
  requestedAmount: 35000,
  requestedTerm: 72,
}

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/v1/financing/capture-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  persistSpy.mockResolvedValue({ ok: true, value: { id: "lead-abc" } })
})

describe("POST /api/v1/financing/capture-lead — happy path", () => {
  it("persists, fans out side-effects, returns 200 with leadId", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { leadId: "lead-abc", message: "Lead captured successfully" },
    })
    expect(persistSpy).toHaveBeenCalledTimes(1)
    expect(sendNotificationEmail).toHaveBeenCalledTimes(1)
    expect(forwardLeadToAutoRaptor).toHaveBeenCalledTimes(1)
  })

  it("uses the first x-forwarded-for entry for rate limiting", async () => {
    const { rateLimit } = await import("@/lib/redis")
    await POST(
      makeReq(VALID_BODY, { "x-forwarded-for": "1.2.3.4, 9.9.9.9" }) as never,
    )
    expect(rateLimit).toHaveBeenCalledWith("capture-lead:1.2.3.4", 5, 3600)
  })

  it("falls back to 'unknown' when x-forwarded-for is empty", async () => {
    const { rateLimit } = await import("@/lib/redis")
    await POST(makeReq(VALID_BODY) as never)
    expect(rateLimit).toHaveBeenCalledWith("capture-lead:unknown", 5, 3600)
  })
})

describe("POST /api/v1/financing/capture-lead — gating", () => {
  it("returns 403 when CSRF origin check fails", async () => {
    const { validateOrigin } = await import("@/lib/csrf")
    vi.mocked(validateOrigin).mockReturnValueOnce(false)
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(403)
    expect(persistSpy).not.toHaveBeenCalled()
  })

  it("returns 429 when rate-limited", async () => {
    const { rateLimit } = await import("@/lib/redis")
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false } as never)
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(429)
    expect(persistSpy).not.toHaveBeenCalled()
  })

  it("returns 400 when body is not valid JSON", async () => {
    const res = await POST(makeReq("{not json", {}) as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Body must be valid JSON")
    expect(persistSpy).not.toHaveBeenCalled()
  })

  it("returns 400 with a descriptive message when Zod rejects", async () => {
    const res = await POST(
      makeReq({ ...VALID_BODY, email: "not-an-email" }) as never,
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toMatch(/email/)
    expect(persistSpy).not.toHaveBeenCalled()
  })

  it("returns 400 with '(root)' label when the body is not an object", async () => {
    const res = await POST(makeReq("\"a string\"") as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/\(root\)/)
    expect(persistSpy).not.toHaveBeenCalled()
  })
})

describe("POST /api/v1/financing/capture-lead — fail-loud on persist", () => {
  it("returns 500 with LEAD_PERSIST_FAILED + retry phone when DB rejects", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    persistSpy.mockResolvedValueOnce({
      ok: false,
      error: { kind: "db-error", message: "relation does not exist", code: "42P01" },
    })
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("LEAD_PERSIST_FAILED")
    expect(json.error.message).toMatch(/\(416\) 555-0100/)
    expect(sendNotificationEmail).not.toHaveBeenCalled()
    expect(forwardLeadToAutoRaptor).not.toHaveBeenCalled()
  })

  it("returns 500 when the repository raises an exception kind", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    persistSpy.mockResolvedValueOnce({
      ok: false,
      error: { kind: "exception", message: "client init failed" },
    })
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error.code).toBe("LEAD_PERSIST_FAILED")
    expect(sendNotificationEmail).not.toHaveBeenCalled()
    expect(forwardLeadToAutoRaptor).not.toHaveBeenCalled()
  })

  it("logs the failure with the captured ip and error kind", async () => {
    const { logger } = await import("@/lib/logger")
    persistSpy.mockResolvedValueOnce({
      ok: false,
      error: { kind: "db-error", message: "boom", code: "X1" },
    })
    await POST(makeReq(VALID_BODY, { "x-forwarded-for": "5.5.5.5" }) as never)
    expect(logger.error).toHaveBeenCalledWith(
      "[capture-lead] persist failed",
      expect.objectContaining({
        kind: "db-error",
        message: "boom",
        code: "X1",
        ip: "5.5.5.5",
      }),
    )
  })
})

describe("POST /api/v1/financing/capture-lead — side-effect resilience", () => {
  it("still returns 200 when notification email rejects", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    const { logger } = await import("@/lib/logger")
    vi.mocked(sendNotificationEmail).mockRejectedValueOnce(new Error("smtp"))
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(200)
    await new Promise((r) => setImmediate(r))
    expect(logger.error).toHaveBeenCalledWith(
      "[capture-lead] notification email failed",
      expect.objectContaining({ leadId: "lead-abc" }),
    )
  })

  it("still returns 200 when ADF forward rejects", async () => {
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const { logger } = await import("@/lib/logger")
    vi.mocked(forwardLeadToAutoRaptor).mockRejectedValueOnce(
      new Error("autoraptor"),
    )
    const res = await POST(makeReq(VALID_BODY) as never)
    expect(res.status).toBe(200)
    await new Promise((r) => setImmediate(r))
    expect(logger.error).toHaveBeenCalledWith(
      "[capture-lead] ADF forward failed",
      expect.objectContaining({ leadId: "lead-abc" }),
    )
  })
})
