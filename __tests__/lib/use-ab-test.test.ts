// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"

vi.mock("@/lib/ab-testing", () => ({
  getVariant: vi.fn(() => "treatment"),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useABTest", () => {
  it("returns the resolved variant after mount", async () => {
    const { useABTest } = await import("@/lib/hooks/use-ab-test")
    const experiment = { variants: ["control", "treatment"] as const }
    const { result } = renderHook(() => useABTest("hero-cta", experiment))
    // After mount the effect ran and set variant to "treatment"
    expect(result.current).toBe("treatment")
  })

  it("invokes getVariant with the experimentId and experiment", async () => {
    const ab = await import("@/lib/ab-testing")
    const { useABTest } = await import("@/lib/hooks/use-ab-test")
    const experiment = { variants: ["a", "b"] as const }
    renderHook(() => useABTest("test-id", experiment))
    expect(ab.getVariant).toHaveBeenCalledWith("test-id", experiment)
  })
})
