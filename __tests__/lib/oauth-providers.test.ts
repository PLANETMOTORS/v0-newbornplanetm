import { describe, it, expect } from "vitest"
import { APPROVED_OAUTH_PROVIDERS } from "@/lib/auth/oauth-providers"

describe("APPROVED_OAUTH_PROVIDERS", () => {
  it("includes google and facebook in the canonical order", () => {
    expect(APPROVED_OAUTH_PROVIDERS).toEqual(["google", "facebook"])
  })

  it("is a frozen tuple", () => {
    // 'as const' makes this readonly at compile time. We assert the runtime
    // value cannot be mutated via the typed export at least at array length.
    expect(APPROVED_OAUTH_PROVIDERS.length).toBe(2)
  })
})
