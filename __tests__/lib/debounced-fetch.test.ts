// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebouncedFetch } from "@/lib/hooks/use-debounced-fetch"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useDebouncedFetch", () => {
  it("returns null when query is below minLength", () => {
    const fetcher = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedFetch({
        query: "a",
        minLength: 2,
        delayMs: 200,
        fetcher,
      }),
    )
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("fetches after debounce delay", async () => {
    const fetcher = vi.fn().mockResolvedValue(["result"])
    const { result } = renderHook(() =>
      useDebouncedFetch({
        query: "tesla",
        minLength: 2,
        delayMs: 200,
        fetcher,
      }),
    )

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      vi.advanceTimersByTime(200)
      await vi.runAllTimersAsync()
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(["result"])
    expect(result.current.isLoading).toBe(false)
  })

  it("does not fetch when disabled", () => {
    const fetcher = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedFetch({
        query: "tesla",
        minLength: 2,
        delayMs: 200,
        fetcher,
        enabled: false,
      }),
    )

    expect(result.current.data).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("aborts on unmount", async () => {
    const fetcher = vi.fn().mockResolvedValue(["data"])
    const { unmount } = renderHook(() =>
      useDebouncedFetch({
        query: "bmw",
        minLength: 2,
        delayMs: 200,
        fetcher,
      }),
    )

    unmount()
    vi.advanceTimersByTime(200)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("resets data when query drops below minLength", async () => {
    const fetcher = vi.fn().mockResolvedValue(["result"])
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useDebouncedFetch({
          query,
          minLength: 2,
          delayMs: 200,
          fetcher,
        }),
      { initialProps: { query: "tesla" } },
    )

    await act(async () => {
      vi.advanceTimersByTime(200)
      await vi.runAllTimersAsync()
    })

    expect(result.current.data).toEqual(["result"])

    rerender({ query: "t" })
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})
