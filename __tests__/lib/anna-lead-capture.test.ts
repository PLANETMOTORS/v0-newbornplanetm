import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFrom = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockRpc = vi.fn()

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(undefined),
}))

function chainMocks(terminal: () => unknown) {
  mockFrom.mockReturnValue({
    insert: mockInsert,
    upsert: mockUpsert,
    update: mockUpdate,
  })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ single: mockSingle })
  mockSingle.mockImplementation(terminal)
  mockUpsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockEq.mockResolvedValue({ error: null })
}

describe("anna/lead-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
  })

  describe("createLead", () => {
    it("creates a lead and returns id", async () => {
      chainMocks(() => Promise.resolve({ data: { id: "lead-1" }, error: null }))

      const { createLead } = await import("@/lib/anna/lead-capture")
      const id = await createLead({
        source: "chat",
        customerName: "John",
        customerEmail: "john@test.com",
        subject: "Interest in Tesla",
      })
      expect(id).toBe("lead-1")
      expect(mockFrom).toHaveBeenCalledWith("leads")
    })

    it("returns null on DB error", async () => {
      chainMocks(() => Promise.resolve({ data: null, error: { message: "fail" } }))

      const { createLead } = await import("@/lib/anna/lead-capture")
      const id = await createLead({
        source: "chat",
        subject: "Test",
      })
      expect(id).toBeNull()
    })

    it("returns null on exception", async () => {
      chainMocks(() => { throw new Error("boom") })

      const { createLead } = await import("@/lib/anna/lead-capture")
      const id = await createLead({
        source: "contact_form",
        subject: "Test",
      })
      expect(id).toBeNull()
    })
  })

  describe("saveConversation", () => {
    it("saves and returns conversation id", async () => {
      chainMocks(() => Promise.resolve({ data: { id: "conv-1" }, error: null }))

      const { saveConversation } = await import("@/lib/anna/lead-capture")
      const id = await saveConversation({ sessionId: "sess-1" })
      expect(id).toBe("conv-1")
      expect(mockFrom).toHaveBeenCalledWith("chat_conversations")
    })

    it("returns null on DB error", async () => {
      chainMocks(() => Promise.resolve({ data: null, error: { message: "fail" } }))

      const { saveConversation } = await import("@/lib/anna/lead-capture")
      const id = await saveConversation({ sessionId: "sess-1" })
      expect(id).toBeNull()
    })

    it("returns null on exception", async () => {
      chainMocks(() => { throw new Error("boom") })

      const { saveConversation } = await import("@/lib/anna/lead-capture")
      const id = await saveConversation({ sessionId: "sess-1" })
      expect(id).toBeNull()
    })
  })

  describe("saveChatMessage", () => {
    it("inserts message and calls RPC", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })
      mockRpc.mockResolvedValue({ error: null })

      const { saveChatMessage } = await import("@/lib/anna/lead-capture")
      await saveChatMessage({
        conversationId: "conv-1",
        role: "user",
        content: "Hello",
      })
      expect(mockFrom).toHaveBeenCalledWith("chat_messages")
    })

    it("handles insert failure gracefully", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error("insert fail")),
      })

      const { saveChatMessage } = await import("@/lib/anna/lead-capture")
      await expect(
        saveChatMessage({ conversationId: "conv-1", role: "user", content: "Hello" })
      ).resolves.toBeUndefined()
    })
  })

  describe("escalateConversation", () => {
    it("creates escalation lead", async () => {
      chainMocks(() => Promise.resolve({ data: { id: "lead-esc" }, error: null }))

      const { escalateConversation } = await import("@/lib/anna/lead-capture")
      const id = await escalateConversation({
        sessionId: "sess-1",
        reason: "Wants human help",
      })
      expect(id).toBe("lead-esc")
    })

    it("updates conversation status when conversationId provided", async () => {
      chainMocks(() => Promise.resolve({ data: { id: "lead-esc" }, error: null }))

      const { escalateConversation } = await import("@/lib/anna/lead-capture")
      await escalateConversation({
        sessionId: "sess-1",
        conversationId: "conv-1",
        reason: "Wants human help",
      })
      expect(mockFrom).toHaveBeenCalledWith("chat_conversations")
    })
  })
})
