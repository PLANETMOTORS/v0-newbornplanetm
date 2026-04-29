import { describe, it, expect, vi, beforeEach } from "vitest"

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}))

describe("anna/knowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
  })

  describe("buildKnowledgePrompt", () => {
    it("returns empty string when no env vars", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
      const result = await buildKnowledgePrompt("anna")
      expect(result).toBe("")
    })

    it("returns empty string when no data", async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null })
      mockOrder.mockReturnValue({ order: mockOrder2 })
      mockEq.mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrder }) })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
      const result = await buildKnowledgePrompt("anna")
      expect(result).toBe("")
    })

    it("returns empty string on query error", async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } })
      mockOrder.mockReturnValue({ order: mockOrder2 })
      mockEq.mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrder }) })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
      const result = await buildKnowledgePrompt("anna")
      expect(result).toBe("")
    })

    it("formats entries into prompt when data exists", async () => {
      const mockData = [
        {
          category: "qa",
          trigger_phrase: "What are your hours?",
          response: "We are open 9-5",
          priority: 10,
          tags: ["hours"],
        },
        {
          category: "policy",
          trigger_phrase: "Return policy",
          response: "10-day money back",
          priority: 5,
          tags: null,
        },
      ]
      const mockOrder2 = vi.fn().mockResolvedValue({ data: mockData, error: null })
      mockOrder.mockReturnValue({ order: mockOrder2 })
      mockEq.mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrder }) })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
      const result = await buildKnowledgePrompt("anna")
      expect(result).toContain("TRAINED KNOWLEDGE")
      expect(result).toContain("What are your hours?")
      expect(result).toContain("We are open 9-5")
      expect(result).toContain("Return policy")
      expect(result).toContain("POLICY OVERRIDES")
      expect(result).toContain("[Tags: hours]")
    })

    it("returns empty string on exception", async () => {
      mockSelect.mockImplementation(() => { throw new Error("boom") })

      const { buildKnowledgePrompt } = await import("@/lib/anna/knowledge")
      const result = await buildKnowledgePrompt("anna")
      expect(result).toBe("")
    })
  })
})
