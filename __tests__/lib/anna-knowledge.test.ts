import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface QueryResult { data: unknown; error: unknown }

let nextResult: QueryResult = { data: null, error: null }

function makeChain(payload: QueryResult) {
  const chain: Record<string, unknown> = {}
  const passthrough = vi.fn(() => chain)
  chain.eq = passthrough
  chain.order = passthrough
  ;(chain as { then: (resolve: (v: unknown) => unknown) => Promise<unknown> }).then = (resolve) =>
    Promise.resolve(payload).then(resolve)
  return chain
}

const fromMock = vi.fn(() => ({
  select: vi.fn(() => makeChain(nextResult)),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: fromMock })),
}))

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
  nextResult = { data: null, error: null }
  fromMock.mockClear()
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

describe("buildKnowledgePrompt", () => {
  it("returns empty string when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty when service key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty when supabase returns an error", async () => {
    nextResult = { data: null, error: { message: "fail" } }
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty when no entries exist", async () => {
    nextResult = { data: [], error: null }
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("builds a prompt grouped by category with mapped labels", async () => {
    nextResult = {
      data: [
        { category: "qa", trigger_phrase: "delivery time", response: "3-5 days", priority: 10, tags: ["delivery"] },
        { category: "policy", trigger_phrase: "refund", response: "30-day refund", priority: 8, tags: null },
        { category: "qa", trigger_phrase: "warranty", response: "30 days", priority: 5, tags: [] },
      ],
      error: null,
    }
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toMatch(/TRAINED KNOWLEDGE & CUSTOM RESPONSES \(3 entries\)/)
    expect(prompt).toMatch(/--- Q&A TRAINED RESPONSES ---/)
    expect(prompt).toMatch(/--- POLICY OVERRIDES ---/)
    expect(prompt).toMatch(/IF customer asks: "delivery time"/)
    expect(prompt).toMatch(/THEN respond: 3-5 days/)
    expect(prompt).toMatch(/\[Tags: delivery\]/)
    // empty tags array produces no tag block
    expect(prompt).toMatch(/THEN respond: 30 days\n\n/)
  })

  it("falls back to UPPERCASE label for unknown categories", async () => {
    nextResult = {
      data: [
        { category: "custom_cat", trigger_phrase: "x", response: "y", priority: 1, tags: null },
      ],
      error: null,
    }
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toMatch(/--- CUSTOM_CAT ---/)
  })

  it("treats missing category as 'qa'", async () => {
    nextResult = {
      data: [
        { category: "", trigger_phrase: "a", response: "b", priority: 1, tags: null },
      ],
      error: null,
    }
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toMatch(/--- Q&A TRAINED RESPONSES ---/)
  })

  it("returns empty string and logs error on thrown exception", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("supabase exploded")
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
    expect(errSpy).toHaveBeenCalledWith("Failed to build knowledge prompt:", expect.any(Error))
  })
})
