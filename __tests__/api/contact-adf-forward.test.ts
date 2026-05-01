/**
 * Verifies that POST /api/contact forwards leads to AutoRaptor (ADF/XML)
 * after persisting and emailing. Pre-launch gap fix: yesterday's wiring
 * only covered finance + trade-in + newsletter; the contact form was
 * silently skipping the dealer's CRM.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("@/lib/redis", () => ({
  rateLimit: vi.fn(async () => ({ success: true, remaining: 5 })),
}))

vi.mock("@/lib/csrf", () => ({
  validateOrigin: vi.fn(() => true),
}))

vi.mock("@/lib/meta-capi-helpers", () => ({
  trackLead: vi.fn(),
}))

const createLeadMock = vi.fn()
vi.mock("@/lib/anna/lead-capture", () => ({
  createLead: (...args: unknown[]) => createLeadMock(...args),
}))

const forwardLeadToAutoRaptorMock = vi.fn()
vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: (...args: unknown[]) =>
    forwardLeadToAutoRaptorMock(...args),
}))

vi.mock("@/lib/validation", () => ({
  isValidEmail: (s: string) => /@/.test(s),
  isValidCanadianPhoneNumber: (s: string) => s.length >= 10,
  isValidCanadianPostalCode: (s: string) => /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(s),
}))

const VALID_BODY = {
  firstName: "José",
  lastName: "Clauberto",
  email: "jose@example.com",
  phone: "4165551234",
  postalCode: "M5V 3A8",
  subject: "Interested in 2024 RAV4",
  message: "Looking for a hybrid SUV under $40k.",
}

beforeEach(() => {
  vi.clearAllMocks()
  createLeadMock.mockResolvedValue("lead-456")
  forwardLeadToAutoRaptorMock.mockResolvedValue({
    ok: true,
    status: "sent",
    messageId: "msg-1",
  })
})

function makeReq(body: unknown = VALID_BODY): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/contact — AutoRaptor ADF forwarding", () => {
  it("returns 200 and forwards the inquiry to AutoRaptor", async () => {
    const { POST } = await import("@/app/api/contact/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
    // microtask for fire-and-forget chain
    await new Promise((r) => setTimeout(r, 10))
    expect(createLeadMock).toHaveBeenCalledTimes(1)
    expect(forwardLeadToAutoRaptorMock).toHaveBeenCalledTimes(1)
    const prospect = forwardLeadToAutoRaptorMock.mock.calls[0][0]
    expect(prospect.id).toBe("lead-456")
    expect(prospect.customer.email).toBe("jose@example.com")
    expect(prospect.customer.firstName).toBe("José")
    expect(prospect.customer.lastName).toBe("Clauberto")
    expect(prospect.customer.phone).toBe("4165551234")
    expect(prospect.source).toBe("Vehicle Inquiry")
    expect(prospect.comments).toContain("Looking for a hybrid")
    expect(prospect.comments).toContain("M5V 3A8")
  })

  it("falls back to a synthetic id when createLead returns null", async () => {
    createLeadMock.mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/contact/route")
    await POST(makeReq())
    await new Promise((r) => setTimeout(r, 10))
    expect(forwardLeadToAutoRaptorMock).toHaveBeenCalledTimes(1)
    const prospect = forwardLeadToAutoRaptorMock.mock.calls[0][0]
    expect(prospect.id).toMatch(/^contact-/)
  })

  it("does not fail the user-facing response if forwarder rejects", async () => {
    forwardLeadToAutoRaptorMock.mockRejectedValueOnce(new Error("smtp down"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { POST } = await import("@/app/api/contact/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 10))
    expect(errSpy).toHaveBeenCalledWith(
      "[contact] ADF forward failed:",
      expect.any(Error),
    )
    errSpy.mockRestore()
  })

  it("does not call the forwarder when validation fails (missing field)", async () => {
    const { POST } = await import("@/app/api/contact/route")
    const res = await POST(makeReq({ ...VALID_BODY, email: "" }))
    expect(res.status).toBe(400)
    await new Promise((r) => setTimeout(r, 10))
    expect(createLeadMock).not.toHaveBeenCalled()
    expect(forwardLeadToAutoRaptorMock).not.toHaveBeenCalled()
  })

  it("rejects requests with invalid origin without forwarding", async () => {
    const { validateOrigin } = await import("@/lib/csrf")
    ;(validateOrigin as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
    const { POST } = await import("@/app/api/contact/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(403)
    expect(forwardLeadToAutoRaptorMock).not.toHaveBeenCalled()
  })
})
