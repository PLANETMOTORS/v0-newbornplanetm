import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({ auth: {} }),
}))

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn().mockReturnValue(new Response("error")),
  ErrorCode: { CONFIG_ERROR: "CONFIG_ERROR" },
}))

describe("supabase/anon-client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("returns error when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { createAnonClientOrError } = await import("@/lib/supabase/anon-client")
    const result = createAnonClientOrError()
    expect("error" in result).toBe(true)
  })

  it("returns client when env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
    const { createAnonClientOrError } = await import("@/lib/supabase/anon-client")
    const result = createAnonClientOrError()
    expect("client" in result).toBe(true)
  })
})
