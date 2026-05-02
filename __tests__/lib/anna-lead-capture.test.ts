import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockUpsertSingle = vi.fn()
const mockUpsertSelect = vi.fn(() => ({ single: mockUpsertSingle }))
const mockUpsert = vi.fn(() => ({ select: mockUpsertSelect }))
const mockUpdateEq = vi.fn().mockResolvedValue({})
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockRpc = vi.fn().mockResolvedValue({})

const mockFrom = vi.fn((table: string) => {
  if (table === "leads") return { insert: mockInsert }
  if (table === "chat_conversations") return { upsert: mockUpsert, update: mockUpdate }
  if (table === "chat_messages") return { insert: vi.fn().mockResolvedValue({}) }
  return { insert: vi.fn(), upsert: vi.fn(), update: vi.fn() }
})

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom, rpc: mockRpc })),
}))

vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: vi
    .fn()
    .mockResolvedValue({ ok: true, status: "sent", messageId: "mock-id" }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("createLead", () => {
  it("inserts a lead and returns its ID", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-123" }, error: null })
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({
      source: "chat",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      subject: "Interested in 2024 RAV4",
    })
    expect(id).toBe("lead-123")
    expect(mockFrom).toHaveBeenCalledWith("leads")
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      source: "chat",
      status: "new",
      priority: "medium",
      customer_name: "Jane Doe",
      customer_email: "jane@example.com",
      subject: "Interested in 2024 RAV4",
    }))
  })

  it("uses high/urgent priority when supplied", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "x" }, error: null })
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({ source: "phone", subject: "x", priority: "urgent" })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ priority: "urgent" }))
  })

  it("returns null and logs on insert error", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "table missing" } })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({ source: "chat", subject: "test" })
    expect(id).toBeNull()
    expect(errSpy).toHaveBeenCalledWith("Lead creation error:", "table missing")
  })

  it("returns null on thrown error", async () => {
    mockSingle.mockRejectedValueOnce(new Error("network"))
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({ source: "chat", subject: "test" })
    expect(id).toBeNull()
  })

  it("logs when notification email fails (fire-and-forget catch)", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-email-fail" }, error: null })
    const { sendNotificationEmail } = await import("@/lib/email")
    ;(sendNotificationEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("SMTP down")
    )
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({ source: "chat", subject: "test email fail" })
    expect(id).toBe("lead-email-fail")
    // Allow microtask to flush the .catch handler
    await new Promise((r) => setTimeout(r, 10))
    expect(errSpy).toHaveBeenCalledWith(
      "Lead notification email failed:",
      expect.any(Error),
    )
    errSpy.mockRestore()
  })

  it("falls back to defaults when name/email are missing", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "y" }, error: null })
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({ source: "chat", subject: "anonymous" })
    const { sendNotificationEmail } = await import("@/lib/email")
    expect(sendNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({
      customerName: "Chat Visitor",
      customerEmail: "unknown@chat",
    }))
  })

  it("forwards identified leads to AutoRaptor as ADF/XML", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-adf-1" }, error: null })
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({
      source: "chat",
      customerName: "Bilal Ahmad",
      customerEmail: "bilal@example.com",
      customerPhone: "+14165551234",
      subject: "Interested in 2024 RAV4 Hybrid",
      vehicleInfo: "VIN ABC123",
    })
    // Allow microtask for the void-fire to flush
    await new Promise((r) => setTimeout(r, 10))
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    expect(forwardLeadToAutoRaptor).toHaveBeenCalledTimes(1)
    const arg = (forwardLeadToAutoRaptor as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(arg.id).toBe("lead-adf-1")
    expect(arg.customer.email).toBe("bilal@example.com")
    expect(arg.customer.firstName).toBe("Bilal")
    expect(arg.customer.lastName).toBe("Ahmad")
    expect(arg.source).toBe("Vehicle Inquiry")
    expect(arg.comments).toContain("VIN ABC123")
  })

  it("skips AutoRaptor forwarding for anonymous chats with no email", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-anon" }, error: null })
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({ source: "chat", subject: "anon" })
    await new Promise((r) => setTimeout(r, 10))
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    expect(forwardLeadToAutoRaptor).not.toHaveBeenCalled()
  })

  it("logs but swallows AutoRaptor forwarder rejection", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-fail" }, error: null })
    const { forwardLeadToAutoRaptor } = await import("@/lib/adf/forwarder")
    ;(forwardLeadToAutoRaptor as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("autoraptor down"),
    )
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({
      source: "chat",
      customerEmail: "x@y.com",
      subject: "test",
    })
    expect(id).toBe("lead-fail")
    await new Promise((r) => setTimeout(r, 10))
    expect(errSpy).toHaveBeenCalledWith(
      "[anna] ADF forward failed:",
      expect.any(Error),
    )
    errSpy.mockRestore()
  })
})

describe("saveConversation", () => {
  it("upserts a conversation by session_id and returns ID", async () => {
    mockUpsertSingle.mockResolvedValueOnce({ data: { id: "conv-1" }, error: null })
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    const id = await saveConversation({ sessionId: "sess-1", customerEmail: "x@y.com" })
    expect(id).toBe("conv-1")
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      session_id: "sess-1",
      customer_email: "x@y.com",
      status: "active",
    }), { onConflict: "session_id" })
  })

  it("returns null on DB error", async () => {
    mockUpsertSingle.mockResolvedValueOnce({ data: null, error: { message: "no table" } })
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    expect(await saveConversation({ sessionId: "sess-2" })).toBeNull()
  })

  it("returns null on thrown error", async () => {
    mockUpsertSingle.mockRejectedValueOnce(new Error("boom"))
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    expect(await saveConversation({ sessionId: "sess-3" })).toBeNull()
  })
})

describe("saveChatMessage", () => {
  it("inserts a chat message and increments count", async () => {
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await saveChatMessage({
      conversationId: "conv-1",
      role: "user",
      content: "Hello",
      metadata: { ip: "1.2.3.4" },
    })
    expect(mockFrom).toHaveBeenCalledWith("chat_messages")
    expect(mockRpc).toHaveBeenCalledWith("increment_message_count", { conv_id: "conv-1" })
  })

  it("swallows outer insert failure", async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error("chat_messages insert failed")
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await expect(
      saveChatMessage({ conversationId: "conv-fail", role: "user", content: "hi" }),
    ).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalledWith(
      "[anna] saveChatMessage failed:",
      expect.any(Error),
    )
    errSpy.mockRestore()
  })

  it("swallows RPC failure", async () => {
    mockRpc.mockRejectedValueOnce(new Error("rpc-down"))
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await expect(
      saveChatMessage({ conversationId: "conv-2", role: "assistant", content: "ok" }),
    ).resolves.toBeUndefined()
  })
})

describe("escalateConversation", () => {
  it("updates the conversation status and creates an urgent lead", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-urgent" }, error: null })
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    const id = await escalateConversation({
      conversationId: "conv-1",
      sessionId: "sess-1",
      customerName: "Jane",
      reason: "Wants test drive",
    })
    expect(id).toBe("lead-urgent")
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "escalated" }))
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      priority: "urgent",
      subject: expect.stringContaining("Escalation"),
    }))
  })

  it("works without a conversationId (no update call)", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-x" }, error: null })
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    const id = await escalateConversation({
      sessionId: "sess-2",
      reason: "general escalation",
    })
    expect(id).toBe("lead-x")
  })

  it("swallows update errors and still creates lead", async () => {
    mockUpdateEq.mockRejectedValueOnce(new Error("update failed"))
    mockSingle.mockResolvedValueOnce({ data: { id: "lead-z" }, error: null })
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    const id = await escalateConversation({
      conversationId: "conv-3",
      sessionId: "sess-3",
      reason: "agent unreachable",
    })
    expect(id).toBe("lead-z")
  })
})
