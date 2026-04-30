import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

const mockOrder2 = vi.fn()
const mockOrder1 = vi.fn(() => ({ order: mockOrder2 }))
const mockEq2 = vi.fn(() => ({ order: mockOrder1 }))
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockEq1 }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
  vi.resetModules()
  vi.clearAllMocks()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

describe("buildKnowledgePrompt", () => {
  it("returns empty string when env vars missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty string when service key missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty string when DB returns no rows", async () => {
    mockOrder2.mockResolvedValueOnce({ data: [], error: null })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("returns empty string on DB error", async () => {
    mockOrder2.mockResolvedValueOnce({ data: null, error: { message: "DB down" } })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
  })

  it("formats knowledge entries grouped by category with category labels", async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        { category: "qa", trigger_phrase: "What is your address?", response: "123 Main St", priority: 5, tags: ["address", "location"] },
        { category: "objection", trigger_phrase: "Too expensive", response: "We have financing", priority: 3, tags: null },
        { category: "policy", trigger_phrase: "Refund?", response: "30 days", priority: 1, tags: [] },
      ],
      error: null,
    })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toContain("TRAINED KNOWLEDGE & CUSTOM RESPONSES (3 entries)")
    expect(prompt).toContain("Q&A TRAINED RESPONSES")
    expect(prompt).toContain("OBJECTION HANDLING")
    expect(prompt).toContain("POLICY OVERRIDES")
    expect(prompt).toContain('IF customer asks: "What is your address?"')
    expect(prompt).toContain("THEN respond: 123 Main St")
    expect(prompt).toContain("[Tags: address, location]")
  })

  it("groups multiple entries under the same category", async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        { category: "qa", trigger_phrase: "Hours?", response: "9-5 Mon-Fri", priority: 5, tags: null },
        { category: "qa", trigger_phrase: "Location?", response: "123 Main St", priority: 3, tags: null },
      ],
      error: null,
    })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toContain("TRAINED KNOWLEDGE & CUSTOM RESPONSES (2 entries)")
    expect(prompt).toContain('IF customer asks: "Hours?"')
    expect(prompt).toContain('IF customer asks: "Location?"')
  })

  it("falls back to category uppercase for unknown labels", async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [{ category: "novel-cat", trigger_phrase: "x", response: "y", priority: 1, tags: null }],
      error: null,
    })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toContain("--- NOVEL-CAT ---")
  })

  it("defaults missing category to 'qa'", async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [{ category: null, trigger_phrase: "a", response: "b", priority: 1, tags: null }],
      error: null,
    })
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    const prompt = await buildKnowledgePrompt("anna")
    expect(prompt).toContain("Q&A TRAINED RESPONSES")
  })

  it("returns empty string and logs on thrown error", async () => {
    mockOrder2.mockRejectedValueOnce(new Error("network failure"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
    expect(await buildKnowledgePrompt("anna")).toBe("")
    expect(errSpy).toHaveBeenCalled()
  })
})
