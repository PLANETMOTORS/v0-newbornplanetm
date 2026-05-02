import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "NODE_ENV"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

const createClientMock = vi.fn(() => ({ tag: "sanity-client" }))

vi.mock("@sanity/client", () => ({
  createClient: createClientMock,
}))

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

describe("sanityClient", () => {
  it("uses fallback projectId when env unset", async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    delete process.env.NEXT_PUBLIC_SANITY_DATASET
    await import("@/lib/sanity/client")
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      projectId: "wlxj8olw",
      dataset: "production",
      apiVersion: "2025-04-01",
    }))
  })

  it("uses fallback projectId when env points to wrong project", async () => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "wrong-project"
    await import("@/lib/sanity/client")
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ projectId: "wlxj8olw" }))
  })

  it("respects valid env projectId override (when matching required)", async () => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "wlxj8olw"
    await import("@/lib/sanity/client")
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ projectId: "wlxj8olw" }))
  })

  it("falls back to production dataset for invalid env value", async () => {
    process.env.NEXT_PUBLIC_SANITY_DATASET = "INVALID DATASET!"
    await import("@/lib/sanity/client")
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ dataset: "production" }))
  })

  it("respects a valid custom dataset name", async () => {
    process.env.NEXT_PUBLIC_SANITY_DATASET = "staging"
    await import("@/lib/sanity/client")
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ dataset: "staging" }))
  })

  it("includes a useCdn boolean", async () => {
    await import("@/lib/sanity/client")
    const lastCall = createClientMock.mock.calls[0][0]
    expect(typeof lastCall.useCdn).toBe("boolean")
  })
})
