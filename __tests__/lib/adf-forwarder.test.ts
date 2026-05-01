import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { ADFProspect } from "@/lib/adf/types"

const mockSendRef = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock("resend", () => {
  // Class-style mock so `new Resend(...)` works with the underlying
  // shared `mockSendRef.send` we can assert on across all test cases.
  class MockResend {
    emails = { send: (...args: unknown[]) => mockSendRef.send(...args) }
    constructor(_apiKey?: string) {}
  }
  return { Resend: MockResend }
})

const baseProspect: ADFProspect = {
  id: "TQ-1",
  requestDate: "2026-04-30T00:00:00.000Z",
  customer: { firstName: "Jenny", lastName: "Iagoudakis" },
  tradeIn: { year: 2008, make: "BMW", model: "M5" },
  source: "Trade-In Quote",
}

let originalEnv: NodeJS.ProcessEnv

describe("forwardLeadToAutoRaptor", () => {
  beforeEach(() => {
    mockSendRef.send.mockReset()
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns skipped when AUTORAPTOR_LEAD_EMAIL is unset", async () => {
    delete process.env.AUTORAPTOR_LEAD_EMAIL
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const result = await forwardLeadToAutoRaptor(baseProspect)
    expect(result.ok).toBe(true)
    expect(result.status).toBe("skipped")
    expect(mockSendRef.send).not.toHaveBeenCalled()
  })

  it("returns error when Resend client is not configured", async () => {
    process.env.AUTORAPTOR_LEAD_EMAIL = "leads@autoraptor.test"
    delete process.env.API_KEY_RESEND
    delete process.env.RESEND_API_KEY
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const result = await forwardLeadToAutoRaptor(baseProspect)
    expect(result.ok).toBe(false)
    expect(result.status).toBe("error")
    expect(result.error).toMatch(/Resend/i)
  })

  it("sends email with ADF XML body when fully configured", async () => {
    process.env.AUTORAPTOR_LEAD_EMAIL = "leads@autoraptor.test"
    process.env.RESEND_API_KEY = "test-key"
    mockSendRef.send.mockResolvedValue({ data: { id: "msg-123" }, error: null })
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const result = await forwardLeadToAutoRaptor(baseProspect)
    expect(result.ok).toBe(true)
    expect(result.status).toBe("sent")
    expect(result.messageId).toBe("msg-123")
    expect(mockSendRef.send).toHaveBeenCalledTimes(1)
    const call = mockSendRef.send.mock.calls[0][0] as {
      to: string
      subject: string
      text: string
    }
    expect(call.to).toBe("leads@autoraptor.test")
    expect(call.subject).toContain("Jenny Iagoudakis")
    expect(call.subject).toContain("TQ-1")
    expect(call.text).toContain("<?adf version")
    expect(call.text).toContain("<vehicle interest=\"trade-in\">")
  })

  it("returns error (does not throw) when Resend fails", async () => {
    process.env.AUTORAPTOR_LEAD_EMAIL = "leads@autoraptor.test"
    process.env.RESEND_API_KEY = "test-key"
    mockSendRef.send.mockResolvedValue({
      data: null,
      error: { message: "Rate limited" },
    })
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    const result = await forwardLeadToAutoRaptor(baseProspect)
    expect(result.ok).toBe(false)
    expect(result.status).toBe("error")
    expect(result.error).toContain("Rate limited")
  })

  it("uses ADF_DEALER_NAME override in vendor section", async () => {
    process.env.AUTORAPTOR_LEAD_EMAIL = "leads@autoraptor.test"
    process.env.RESEND_API_KEY = "test-key"
    process.env.ADF_DEALER_NAME = "Custom Dealer Inc"
    mockSendRef.send.mockResolvedValue({ data: { id: "x" }, error: null })
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    await forwardLeadToAutoRaptor(baseProspect)
    const xmlBody = mockSendRef.send.mock.calls[0][0].text as string
    expect(xmlBody).toContain("Custom Dealer Inc")
  })
})
