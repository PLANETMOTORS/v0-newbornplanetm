// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import { FIXTURE_SUMMARY, FIXTURE_VIN, jsonResponse } from "@/__tests__/fixtures/carfax"

function mockFetchResolve(body: unknown, init: ResponseInit = { status: 200 }) {
  globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(body, init)) as unknown as typeof fetch
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useCarfaxSummary", () => {
  it("starts in loading state and resolves to ready on a successful fetch", async () => {
    mockFetchResolve({ enabled: true, vin: FIXTURE_VIN, source: "live", summary: FIXTURE_SUMMARY })
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status === "ready") {
      expect(result.current.summary.vin).toBe(FIXTURE_VIN)
      expect(result.current.stale).toBe(false)
    }
  })

  it("returns disabled on the very first render when vin is null (no skeleton flicker)", async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { result } = renderHook(() => useCarfaxSummary(null))
    // Critical: lazy useState means the initial render is already
    // 'disabled' rather than briefly 'loading' before the effect runs.
    expect(result.current.status).toBe("disabled")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("returns disabled when the API replies enabled:false", async () => {
    mockFetchResolve({ enabled: false, vin: FIXTURE_VIN, summary: null, message: "off" })
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    await waitFor(() => expect(result.current.status).toBe("disabled"))
  })

  it("returns no-report when summary.hasReport is false", async () => {
    mockFetchResolve({
      enabled: true,
      vin: FIXTURE_VIN,
      source: "live",
      summary: { ...FIXTURE_SUMMARY, hasReport: false, resultCode: -10 },
    })
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    await waitFor(() => expect(result.current.status).toBe("no-report"))
  })

  it("flags stale=true when source is stale-fallback", async () => {
    mockFetchResolve({
      enabled: true,
      vin: FIXTURE_VIN,
      source: "stale-fallback",
      summary: FIXTURE_SUMMARY,
    })
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status === "ready") {
      expect(result.current.stale).toBe(true)
    }
  })

  it("returns error on a non-2xx response", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("oops", { status: 502 })) as unknown as typeof fetch
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("returns error on a network exception", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch
    const { result } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("encodes the VIN safely into the URL", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ enabled: true, vin: FIXTURE_VIN, source: "live", summary: FIXTURE_SUMMARY }),
      )
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    renderHook(() => useCarfaxSummary("a/b?c"))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v1/carfax/a%2Fb%3Fc")
  })

  it("aborts the in-flight request after unmount (no orphaned setState)", async () => {
    let abortReceived = false
    globalThis.fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            abortReceived = true
            reject(new DOMException("aborted", "AbortError"))
          })
        }),
    ) as unknown as typeof fetch
    const { result, unmount } = renderHook(() => useCarfaxSummary(FIXTURE_VIN))
    expect(result.current.status).toBe("loading")
    unmount()
    await waitFor(() => expect(abortReceived).toBe(true))
  })
})
