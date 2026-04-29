import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock createClient before importing
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}))

import { initiateOAuthLogin } from "@/lib/auth/oauth-helpers"
import { createClient } from "@/lib/supabase/client"

const mockCreateClient = vi.mocked(createClient)

describe("initiateOAuthLogin", () => {
  const originalLocation = globalThis.location

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(globalThis, "location", {
      value: { origin: "https://example.com", assign: vi.fn() },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it("calls signInWithOAuth and redirects on success", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: "https://oauth.example.com/authorize" },
      error: null,
    })
    mockCreateClient.mockReturnValue({ auth: { signInWithOAuth } } as never)

    await initiateOAuthLogin("google", "/dashboard")

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://example.com/auth/callback?redirectTo=%2Fdashboard",
      },
    })
    expect(globalThis.location.assign).toHaveBeenCalledWith(
      "https://oauth.example.com/authorize",
    )
  })

  it("throws when OAuth returns an error", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("OAuth failed"),
    })
    mockCreateClient.mockReturnValue({ auth: { signInWithOAuth } } as never)

    await expect(initiateOAuthLogin("facebook", "/")).rejects.toThrow("OAuth failed")
  })

  it("does not redirect when no URL is returned", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: null },
      error: null,
    })
    mockCreateClient.mockReturnValue({ auth: { signInWithOAuth } } as never)

    await initiateOAuthLogin("google", "/")
    expect(globalThis.location.assign).not.toHaveBeenCalled()
  })
})
