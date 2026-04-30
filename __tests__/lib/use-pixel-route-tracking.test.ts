// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"

// Programmable pathname mock — flipped per test before re-rendering
let currentPathname = "/"
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}))

// Local stand-alone type (NOT Window-extending) so this file does
// not accidentally collide with the `declare global { interface Window }`
// augmentations in the pixel components, which use narrower shapes
// for ttq/uetq.
type PixelWindow = {
  fbq?: (...args: unknown[]) => void
  snaptr?: (...args: unknown[]) => void
  ttq?: { page: () => void; track: (e: string) => void }
  uetq?: { push: (...args: unknown[]) => void } | unknown[]
  dataLayer?: Record<string, unknown>[]
}

const w = () => globalThis.window as unknown as PixelWindow

beforeEach(() => {
  currentPathname = "/"
})

afterEach(() => {
  delete w().fbq
  delete w().snaptr
  delete w().ttq
  delete w().uetq
  delete w().dataLayer
})

describe("usePixelRouteTracking — first render", () => {
  it("does NOT fire any pixel on initial mount (avoids double PageView)", async () => {
    w().fbq = vi.fn()
    w().snaptr = vi.fn()
    w().ttq = { page: vi.fn(), track: vi.fn() }
    w().uetq = { push: vi.fn() }
    w().dataLayer = []

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    renderHook(() => usePixelRouteTracking())

    expect(w().fbq).not.toHaveBeenCalled()
    expect(w().snaptr).not.toHaveBeenCalled()
    expect((w().ttq as { page: ReturnType<typeof vi.fn> }).page).not.toHaveBeenCalled()
    expect(
      (w().uetq as { push: ReturnType<typeof vi.fn> }).push,
    ).not.toHaveBeenCalled()
    expect(w().dataLayer).toHaveLength(0)
  })
})

describe("usePixelRouteTracking — route change", () => {
  it("fires Meta PageView on route change", async () => {
    const fbq = vi.fn()
    w().fbq = fbq

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/inventory"
    rerender()

    expect(fbq).toHaveBeenCalledWith("track", "PageView")
  })

  it("fires Snap PAGE_VIEW on route change", async () => {
    const snaptr = vi.fn()
    w().snaptr = snaptr

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/finance"
    rerender()

    expect(snaptr).toHaveBeenCalledWith("track", "PAGE_VIEW")
  })

  it("fires TikTok page() on route change", async () => {
    const page = vi.fn()
    w().ttq = { page, track: vi.fn() }

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/sell-trade"
    rerender()

    expect(page).toHaveBeenCalledTimes(1)
  })

  it("fires Bing UET pageLoad on route change", async () => {
    const push = vi.fn()
    w().uetq = { push }

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/contact"
    rerender()

    expect(push).toHaveBeenCalledWith("pageLoad")
  })

  it("pushes virtualPageView to GTM dataLayer with the new pathname", async () => {
    const dataLayer: Record<string, unknown>[] = []
    w().dataLayer = dataLayer

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/vehicles/2024-honda-civic"
    rerender()

    expect(dataLayer).toEqual([
      { event: "virtualPageView", page_path: "/vehicles/2024-honda-civic" },
    ])
  })

  it("fires every pixel exactly once per route change", async () => {
    const fbq = vi.fn()
    const snaptr = vi.fn()
    const page = vi.fn()
    const push = vi.fn()
    w().fbq = fbq
    w().snaptr = snaptr
    w().ttq = { page, track: vi.fn() }
    w().uetq = { push }
    w().dataLayer = []

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/page-a"
    rerender()
    currentPathname = "/page-b"
    rerender()

    expect(fbq).toHaveBeenCalledTimes(2)
    expect(snaptr).toHaveBeenCalledTimes(2)
    expect(page).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledTimes(2)
    expect(w().dataLayer).toHaveLength(2)
  })

  it("is a no-op when pixel globals are not present", async () => {
    // No window.fbq, snaptr, ttq, uetq, dataLayer at all — should not throw.
    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())
    currentPathname = "/anywhere"
    expect(() => rerender()).not.toThrow()
  })

  it("guards against ttq stub-array (pre-load) where .page is missing", async () => {
    // Before ttq.load() runs, ttq is a stub array with .push but no .page().
    w().ttq = [] as unknown as PixelWindow["ttq"]

    const { usePixelRouteTracking } = await import(
      "@/lib/hooks/use-pixel-route-tracking"
    )
    const { rerender } = renderHook(() => usePixelRouteTracking())

    currentPathname = "/inventory"
    expect(() => rerender()).not.toThrow()
  })
})
