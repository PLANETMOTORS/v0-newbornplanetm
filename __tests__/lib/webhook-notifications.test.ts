import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/autoraptor", () => ({
  createAutoRaptorLead: vi.fn().mockResolvedValue({ success: true, leadId: "ar-1" }),
}))
vi.mock("@/lib/email", () => ({
  escapeHtml: (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
}))
vi.mock("@/lib/redact", () => ({
  maskEmail: (e: string) => e.replace(/(.{2}).*(@.*)/, "$1***$2"),
}))
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ error: null }) },
  })),
}))

describe("webhook-notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("extractNotificationData", () => {
    it("extracts data from a checkout session", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_123",
        customer_details: { email: "john@test.com", name: "John Doe", phone: "+1234567890" },
        customer_email: null,
        metadata: {
          vehicleId: "v-1",
          vehicleName: "2023 Tesla Model 3",
          vehicleYear: "2023",
          vehicleMake: "Tesla",
          vehicleModel: "Model 3",
          type: "vehicle-purchase",
          stockNumber: "PM-001",
        },
        amount_total: 5000000,
        currency: "cad",
      }

      const data = extractNotificationData(session as never)
      expect(data).not.toBeNull()
      expect(data?.customerEmail).toBe("john@test.com")
      expect(data?.customerName).toBe("John Doe")
      expect(data?.vehicleName).toBe("2023 Tesla Model 3")
      expect(data?.amountCents).toBe(5000000)
      expect(data?.isDeposit).toBe(false)
    })

    it("returns null when no email", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_123",
        customer_details: { email: null, name: null, phone: null },
        customer_email: null,
        metadata: {},
        amount_total: 0,
        currency: "cad",
      }
      expect(extractNotificationData(session as never)).toBeNull()
    })

    it("detects deposit for vehicle-reservation type", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_456",
        customer_details: { email: "jane@test.com", name: null, phone: null },
        customer_email: null,
        metadata: { type: "vehicle-reservation" },
        amount_total: 25000,
        currency: "cad",
      }
      const data = extractNotificationData(session as never)
      expect(data?.isDeposit).toBe(true)
    })

    it("detects deposit when depositOnly flag is set", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_789",
        customer_details: { email: "bob@test.com", name: null, phone: null },
        customer_email: null,
        metadata: { depositOnly: "true" },
        amount_total: 25000,
        currency: "cad",
      }
      const data = extractNotificationData(session as never)
      expect(data?.isDeposit).toBe(true)
    })

    it("uses fallback customer name from email", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_111",
        customer_details: { email: "alice@test.com", name: null, phone: null },
        customer_email: null,
        metadata: {},
        amount_total: 0,
        currency: "cad",
      }
      const data = extractNotificationData(session as never)
      expect(data?.customerName).toBe("alice")
    })

    it("uses metadata customerName when customer_details.name missing", async () => {
      const { extractNotificationData } = await import("@/lib/webhook-notifications")
      const session = {
        id: "cs_222",
        customer_details: { email: "x@test.com", name: null, phone: null },
        customer_email: null,
        metadata: { customerName: "From Metadata" },
        amount_total: 0,
        currency: "cad",
      }
      const data = extractNotificationData(session as never)
      expect(data?.customerName).toBe("From Metadata")
    })
  })

  describe("sendPaymentNotifications", () => {
    it("runs all notification tasks without throwing", async () => {
      process.env.API_KEY_RESEND = "re_test"
      const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
      await expect(
        sendPaymentNotifications({
          customerEmail: "john@test.com",
          customerName: "John",
          vehicleName: "2023 Tesla",
          amountCents: 25000,
          currency: "cad",
          stripeSessionId: "cs_test",
          isDeposit: true,
        })
      ).resolves.toBeUndefined()
    })
  })
})
