// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useDebounce } from "@/lib/hooks/use-debounce"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useDebounce", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300))
    expect(result.current).toBe("a")
  })

  it("updates only after the delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    })
    rerender({ v: "b" })
    expect(result.current).toBe("a")
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe("a")
    act(() => { vi.advanceTimersByTime(2) })
    expect(result.current).toBe("b")
  })

  it("cancels the previous timer when value changes again", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    })
    rerender({ v: "b" })
    act(() => { vi.advanceTimersByTime(150) })
    rerender({ v: "c" })
    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current).toBe("a")
    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current).toBe("c")
  })

  it("uses default delay of 300ms when not specified", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v), {
      initialProps: { v: 1 },
    })
    rerender({ v: 2 })
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe(1)
    act(() => { vi.advanceTimersByTime(2) })
    expect(result.current).toBe(2)
  })
})
