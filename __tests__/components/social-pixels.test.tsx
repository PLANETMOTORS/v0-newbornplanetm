// @vitest-environment jsdom
/**
 * Tests for the three social/marketing pixels. Each pixel is a thin
 * `next/script` wrapper double-gated by:
 *
 *   1. its env var being set (NEXT_PUBLIC_TIKTOK_PIXEL_ID, etc.)
 *   2. the corresponding Consent Mode v2 category being granted
 *
 * The unit-test surface here is the gating itself — we don't try to
 * exercise the inline JS body inside <Script>, that runs in the
 * browser and is covered by manual smoke + GTM Tag Assistant.
 *
 * `next/script` is mocked to a span we can introspect so we can
 * assert "rendered the script" vs "returned null".
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

// ---------------------------------------------------------------------------
// Module mocks — must be hoisted before the SUT imports
// ---------------------------------------------------------------------------

vi.mock("next/script", () => ({
  // Stand-in that surfaces the inline body via a data attribute so we
  // can assert "rendered" without involving the real Next loader.
  default: ({ id, children }: { id?: string; children?: React.ReactNode }) => (
    <span data-testid={`script-${id ?? "unknown"}`}>{children}</span>
  ),
}))

// Programmable consent mock — every test resets this to its preferred
// state before importing the SUT.
const consentState = {
  hasAnalyticsConsent: false,
  hasMarketingConsent: false,
}
vi.mock("@/lib/hooks/use-cookie-consent", () => ({
  useCookieConsent: () => consentState,
}))

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  consentState.hasAnalyticsConsent = false
  consentState.hasMarketingConsent = false
  delete process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
  delete process.env.NEXT_PUBLIC_BING_UET_ID
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

// ---------------------------------------------------------------------------
// TikTok Pixel
// ---------------------------------------------------------------------------

describe("TikTokPixel", () => {
  it("renders nothing when env var is unset", async () => {
    consentState.hasMarketingConsent = true
    const { TikTokPixel } = await import("@/components/analytics/tiktok-pixel")
    const { container } = render(<TikTokPixel />)
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when env var is set but marketing consent is denied", async () => {
    process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = "C123ABC"
    consentState.hasMarketingConsent = false
    const { TikTokPixel } = await import("@/components/analytics/tiktok-pixel")
    const { container } = render(<TikTokPixel />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the script when both env var is set AND marketing consent granted", async () => {
    process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = "C123ABC"
    consentState.hasMarketingConsent = true
    const { TikTokPixel } = await import("@/components/analytics/tiktok-pixel")
    const { getByTestId } = render(<TikTokPixel />)
    const node = getByTestId("script-tiktok-pixel")
    expect(node).toBeTruthy()
    expect(node.textContent).toContain("ttq.load('C123ABC')")
    expect(node.textContent).toContain("ttq.page()")
  })

  it("trackTikTokEvent is a no-op when ttq is not on window", async () => {
    const { trackTikTokEvent } = await import("@/components/analytics/tiktok-pixel")
    expect(() => trackTikTokEvent("ViewContent", { id: "x" })).not.toThrow()
  })

  it("trackTikTokEvent forwards to window.ttq.track when present", async () => {
    const trackSpy = vi.fn()
    const ttq = { load: vi.fn(), page: vi.fn(), track: trackSpy }
    Object.defineProperty(window, "ttq", { value: ttq, configurable: true, writable: true })

    const { trackTikTokEvent } = await import("@/components/analytics/tiktok-pixel")
    trackTikTokEvent("ViewContent", { id: "x" })
    expect(trackSpy).toHaveBeenCalledWith("ViewContent", { id: "x" })

    delete (window as unknown as Record<string, unknown>).ttq
  })
})

// ---------------------------------------------------------------------------
// Microsoft Clarity
// ---------------------------------------------------------------------------

describe("MicrosoftClarity", () => {
  it("renders nothing when env var is unset", async () => {
    consentState.hasAnalyticsConsent = true
    const { MicrosoftClarity } = await import("@/components/analytics/microsoft-clarity")
    const { container } = render(<MicrosoftClarity />)
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when analytics consent is denied", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc12345"
    consentState.hasAnalyticsConsent = false
    const { MicrosoftClarity } = await import("@/components/analytics/microsoft-clarity")
    const { container } = render(<MicrosoftClarity />)
    expect(container.innerHTML).toBe("")
  })

  it("does NOT render under marketing-only consent (Clarity is analytics, not marketing)", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc12345"
    consentState.hasAnalyticsConsent = false
    consentState.hasMarketingConsent = true
    const { MicrosoftClarity } = await import("@/components/analytics/microsoft-clarity")
    const { container } = render(<MicrosoftClarity />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the script when env var set AND analytics consent granted", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc12345"
    consentState.hasAnalyticsConsent = true
    const { MicrosoftClarity } = await import("@/components/analytics/microsoft-clarity")
    const { getByTestId } = render(<MicrosoftClarity />)
    const node = getByTestId("script-microsoft-clarity")
    expect(node.textContent).toContain('"abc12345"')
    expect(node.textContent).toContain("clarity.ms/tag/")
  })

  it("tagClaritySession + identifyClaritySession are no-ops when clarity is not on window", async () => {
    const { tagClaritySession, identifyClaritySession } = await import("@/components/analytics/microsoft-clarity")
    expect(() => tagClaritySession("k", "v")).not.toThrow()
    expect(() => identifyClaritySession("user-1")).not.toThrow()
  })

  it("forward to window.clarity when present", async () => {
    const clarity = vi.fn()
    Object.defineProperty(window, "clarity", { value: clarity, configurable: true, writable: true })

    const { tagClaritySession, identifyClaritySession } = await import("@/components/analytics/microsoft-clarity")
    tagClaritySession("plan", "premium")
    identifyClaritySession("user-1")

    expect(clarity).toHaveBeenCalledWith("set", "plan", "premium")
    expect(clarity).toHaveBeenCalledWith("identify", "user-1")

    delete (window as unknown as Record<string, unknown>).clarity
  })
})

// ---------------------------------------------------------------------------
// Bing UET
// ---------------------------------------------------------------------------

describe("BingUET", () => {
  it("renders nothing when env var is unset", async () => {
    consentState.hasMarketingConsent = true
    const { BingUET } = await import("@/components/analytics/bing-uet")
    const { container } = render(<BingUET />)
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when marketing consent is denied", async () => {
    process.env.NEXT_PUBLIC_BING_UET_ID = "12345"
    consentState.hasMarketingConsent = false
    const { BingUET } = await import("@/components/analytics/bing-uet")
    const { container } = render(<BingUET />)
    expect(container.innerHTML).toBe("")
  })

  it("does NOT render under analytics-only consent (UET is marketing, not analytics)", async () => {
    process.env.NEXT_PUBLIC_BING_UET_ID = "12345"
    consentState.hasAnalyticsConsent = true
    consentState.hasMarketingConsent = false
    const { BingUET } = await import("@/components/analytics/bing-uet")
    const { container } = render(<BingUET />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the script when env var set AND marketing consent granted", async () => {
    process.env.NEXT_PUBLIC_BING_UET_ID = "12345"
    consentState.hasMarketingConsent = true
    const { BingUET } = await import("@/components/analytics/bing-uet")
    const { getByTestId } = render(<BingUET />)
    const node = getByTestId("script-bing-uet")
    expect(node.textContent).toContain('ti:"12345"')
    expect(node.textContent).toContain("bat.bing.com/bat.js")
    expect(node.textContent).toContain("pageLoad")
  })

  it("trackBingEvent is a no-op when uetq is not on window", async () => {
    const { trackBingEvent } = await import("@/components/analytics/bing-uet")
    expect(() => trackBingEvent("conversion", { revenue: 1000 })).not.toThrow()
  })

  it("trackBingEvent pushes to window.uetq when present", async () => {
    const uetq: unknown[] = []
    const pushSpy = vi.spyOn(uetq, "push")
    Object.defineProperty(window, "uetq", { value: uetq, configurable: true, writable: true })

    const { trackBingEvent } = await import("@/components/analytics/bing-uet")
    trackBingEvent("conversion", { revenue: 1000 })
    expect(pushSpy).toHaveBeenCalledWith("event", "conversion", { revenue: 1000 })

    delete (window as unknown as Record<string, unknown>).uetq
  })

  it("trackBingEvent uses an empty props object when none provided", async () => {
    const uetq: unknown[] = []
    const pushSpy = vi.spyOn(uetq, "push")
    Object.defineProperty(window, "uetq", { value: uetq, configurable: true, writable: true })

    const { trackBingEvent } = await import("@/components/analytics/bing-uet")
    trackBingEvent("conversion")
    expect(pushSpy).toHaveBeenCalledWith("event", "conversion", {})

    delete (window as unknown as Record<string, unknown>).uetq
  })
})
