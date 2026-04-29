// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { useUTMParams, getUTMParams, clearUTMParams } from "@/lib/hooks/use-utm-params"

const STORAGE_KEY = "pm_utm_params"

beforeEach(() => {
  sessionStorage.clear()
  globalThis.window.history.replaceState({}, "", "/")
})

afterEach(() => {
  sessionStorage.clear()
})

describe("useUTMParams", () => {
  it("captures all UTM keys from the query string into sessionStorage", () => {
    globalThis.window.history.replaceState(
      {},
      "",
      "/?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=tesla&utm_content=banner",
    )
    renderHook(() => useUTMParams())
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")
    expect(stored.utm_source).toBe("google")
    expect(stored.utm_medium).toBe("cpc")
    expect(stored.utm_campaign).toBe("spring")
    expect(stored.utm_term).toBe("tesla")
    expect(stored.utm_content).toBe("banner")
    expect(stored.captured_at).toBeDefined()
  })

  it("does not overwrite existing UTM params", () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ utm_source: "old" }))
    globalThis.window.history.replaceState({}, "", "/?utm_source=new")
    renderHook(() => useUTMParams())
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}").utm_source).toBe("old")
  })

  it("does not store anything if no UTM params present", () => {
    globalThis.window.history.replaceState({}, "", "/")
    renderHook(() => useUTMParams())
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe("getUTMParams", () => {
  it("returns the parsed object when present", () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ utm_source: "fb" }))
    expect(getUTMParams()?.utm_source).toBe("fb")
  })

  it("returns null when none stored", () => {
    expect(getUTMParams()).toBeNull()
  })

  it("returns null on JSON parse failure", () => {
    sessionStorage.setItem(STORAGE_KEY, "{ not-json")
    expect(getUTMParams()).toBeNull()
  })
})

describe("clearUTMParams", () => {
  it("removes the stored params", () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ utm_source: "x" }))
    clearUTMParams()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
