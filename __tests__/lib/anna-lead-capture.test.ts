import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface QueryResult { data: unknown; error: unknown }
let nextResult: QueryResult = { data: null, error: null }

interface ChainStub {
  insert: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  then: (resolve: (v: unknown) => unknown) => Promise<unknown>
  __payload: QueryResult
}

const lastChain: { current: ChainStub | null } = { current: null }

function makeChain(payload: QueryResult): ChainStub {
  const stub: Partial<ChainStub> = { __payload: payload }
  const passthrough = vi.fn(() => stub as ChainStub)
  stub.insert = passthrough
  stub.upsert = passthrough
  stub.update = passthrough
  stub.select = passthrough
  stub.eq = passthrough
  stub.single = vi.fn(async () => payload)
  ;(stub as unknown as PromiseLike<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(payload).then(resolve)
  return stub as ChainStub
}

const rpcMock = vi.fn(async () => ({ error: null }))

const fromMock = vi.fn(() => {
  lastChain.current = makeChain(nextResult)
  return lastChain.current
})

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: fromMock,
    rpc: rpcMock,
  })),
}))

const sendNotificationEmailMock = vi.fn(async () => undefined)
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: (args: unknown) => sendNotificationEmailMock(args),
}))

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "k"
  nextResult = { data: { id: "lead-123" }, error: null }
  lastChain.current = null
  fromMock.mockClear()
  rpcMock.mockClear()
  sendNotificationEmailMock.mockClear()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("createLead", () => {
  it("inserts a lead and returns its id, fires notification email", async () => {
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({
      source: "chat",
      customerName: "Jane",
      customerEmail: "jane@x.com",
      vehicleId: "v1",
      subject: "Q",
      message: "Body",
    })
    expect(id).toBe("lead-123")
    expect(fromMock).toHaveBeenCalledWith("leads")
    expect(lastChain.current?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "chat",
        status: "new",
        priority: "medium",
        customer_name: "Jane",
        customer_email: "jane@x.com",
        vehicle_id: "v1",
        subject: "Q",
        message: "Body",
      }),
    )
    expect(sendNotificationEmailMock).toHaveBeenCalled()
    const arg = sendNotificationEmailMock.mock.calls[0][0] as { additionalData: { source: string } }
    expect(arg.additionalData.source).toBe("Anna AI Chat")
  })

  it("uses 'Chat Visitor' fallback for missing customerName", async () => {
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({ source: "test_drive", subject: "S" })
    const emailArg = sendNotificationEmailMock.mock.calls[0][0] as {
      customerName: string
      customerEmail: string
      additionalData: { source: string }
    }
    expect(emailArg.customerName).toBe("Chat Visitor")
    expect(emailArg.customerEmail).toBe("unknown@chat")
    expect(emailArg.additionalData.source).toBe("test_drive") // non-chat source preserved
  })

  it("returns null and logs error on insert error", async () => {
    nextResult = { data: null, error: { message: "table missing" } }
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    expect(await createLead({ source: "chat", subject: "S" })).toBe(null)
    expect(errSpy).toHaveBeenCalledWith("Lead creation error:", "table missing")
  })

  it("returns null and logs when supabase client throws", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("supabase down")
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    expect(await createLead({ source: "chat", subject: "S" })).toBe(null)
    expect(errSpy).toHaveBeenCalledWith("Lead capture failed:", expect.any(Error))
  })

  it("propagates priority and uses 'medium' default", async () => {
    const { createLead } = await import("@/lib/anna/lead-capture")
    await createLead({ source: "chat", subject: "Q", priority: "urgent" })
    expect(lastChain.current?.insert).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "urgent" }),
    )

    fromMock.mockClear()
    await createLead({ source: "chat", subject: "Q" })
    expect(lastChain.current?.insert).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "medium" }),
    )
  })

  it("logs but doesn't throw if notification email fails", async () => {
    sendNotificationEmailMock.mockRejectedValueOnce(new Error("mail down"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createLead } = await import("@/lib/anna/lead-capture")
    const id = await createLead({ source: "chat", subject: "S" })
    expect(id).toBe("lead-123")
    // microtask flush
    await new Promise(r => setTimeout(r, 0))
    expect(errSpy).toHaveBeenCalledWith("Lead notification email failed:", expect.any(Error))
  })

  it("returns null when insert succeeds but no row id present", async () => {
    nextResult = { data: null, error: null }
    const { createLead } = await import("@/lib/anna/lead-capture")
    expect(await createLead({ source: "chat", subject: "S" })).toBe(null)
  })
})

describe("saveConversation", () => {
  it("upserts a conversation and returns id", async () => {
    nextResult = { data: { id: "conv-1" }, error: null }
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    const id = await saveConversation({
      sessionId: "s-1",
      customerName: "X",
      customerEmail: "x@x.com",
      vehicleContext: { make: "Tesla" },
    })
    expect(id).toBe("conv-1")
    expect(fromMock).toHaveBeenCalledWith("chat_conversations")
    expect(lastChain.current?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: "s-1", status: "active" }),
      { onConflict: "session_id" },
    )
  })

  it("returns null on supabase error", async () => {
    nextResult = { data: null, error: { message: "missing" } }
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    expect(await saveConversation({ sessionId: "s-1" })).toBe(null)
    expect(errSpy).toHaveBeenCalled()
  })

  it("returns null when supabase throws", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("network")
    })
    const { saveConversation } = await import("@/lib/anna/lead-capture")
    expect(await saveConversation({ sessionId: "s-1" })).toBe(null)
  })
})

describe("saveChatMessage", () => {
  it("inserts message and calls increment_message_count RPC", async () => {
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await saveChatMessage({
      conversationId: "c-1",
      role: "user",
      content: "Hello",
      metadata: { x: 1 },
    })
    expect(fromMock).toHaveBeenCalledWith("chat_messages")
    expect(lastChain.current?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: "c-1",
        role: "user",
        content: "Hello",
      }),
    )
    expect(rpcMock).toHaveBeenCalledWith("increment_message_count", { conv_id: "c-1" })
  })

  it("logs but does not throw when RPC fails", async () => {
    rpcMock.mockImplementationOnce(() => Promise.reject(new Error("rpc fail")))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await saveChatMessage({ conversationId: "c-1", role: "system", content: "x" })
    expect(errSpy).toHaveBeenCalledWith("[anna] increment_message_count RPC failed:", expect.any(Error))
  })

  it("logs but does not throw when insert fails", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { saveChatMessage } = await import("@/lib/anna/lead-capture")
    await saveChatMessage({ conversationId: "c-1", role: "user", content: "Hi" })
    expect(errSpy).toHaveBeenCalledWith("[anna] saveChatMessage failed:", expect.any(Error))
  })
})

describe("escalateConversation", () => {
  it("updates conversation status and creates an urgent lead", async () => {
    nextResult = { data: { id: "lead-x" }, error: null }
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    const id = await escalateConversation({
      conversationId: "c-1",
      sessionId: "s-1",
      customerName: "Jane",
      customerEmail: "j@x.com",
      reason: "wants human",
    })
    expect(id).toBe("lead-x")
    // chat_conversations update + leads insert
    const fromCalls = fromMock.mock.calls.map(c => c[0])
    expect(fromCalls).toContain("chat_conversations")
    expect(fromCalls).toContain("leads")
  })

  it("logs but proceeds when conversation update throws", async () => {
    let firstCall = true
    fromMock.mockImplementation((tbl: string) => {
      if (firstCall && tbl === "chat_conversations") {
        firstCall = false
        throw new Error("update fail")
      }
      lastChain.current = makeChain(nextResult)
      return lastChain.current
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    const id = await escalateConversation({
      conversationId: "c-1",
      sessionId: "s-1",
      reason: "x",
    })
    expect(errSpy).toHaveBeenCalledWith("[anna] escalateConversation status update failed:", expect.any(Error))
    expect(id).toBe("lead-123")
  })

  it("skips status update when conversationId is missing", async () => {
    const { escalateConversation } = await import("@/lib/anna/lead-capture")
    await escalateConversation({ sessionId: "s-1", reason: "r" })
    // Only "leads" should be referenced
    const tables = fromMock.mock.calls.map(c => c[0])
    expect(tables).not.toContain("chat_conversations")
    expect(tables).toContain("leads")
  })
})
