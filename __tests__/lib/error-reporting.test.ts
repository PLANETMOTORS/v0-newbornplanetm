import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { reportError, reportMessage } from "@/lib/error-reporting"

let errSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>
let infoSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
})

afterEach(() => {
  errSpy.mockRestore()
  warnSpy.mockRestore()
  infoSpy.mockRestore()
})

describe("reportError", () => {
  it("logs to console.error with context when context is provided", () => {
    const err = new Error("boom")
    reportError(err, { foo: "bar" })
    expect(errSpy).toHaveBeenCalledWith("[reportError]", err, { foo: "bar" })
  })

  it("logs without context when none is provided", () => {
    const err = new Error("boom")
    reportError(err)
    expect(errSpy).toHaveBeenCalledWith("[reportError]", err)
  })
})

describe("reportMessage", () => {
  it("routes 'error' level to console.error", () => {
    reportMessage("hi", "error")
    expect(errSpy).toHaveBeenCalled()
  })

  it("routes 'warning' level to console.warn", () => {
    reportMessage("hi", "warning")
    expect(warnSpy).toHaveBeenCalled()
  })

  it("routes 'info' level to console.info", () => {
    reportMessage("hi", "info")
    expect(infoSpy).toHaveBeenCalled()
  })

  it("includes context when provided", () => {
    reportMessage("hi", "info", { foo: "bar" })
    expect(infoSpy).toHaveBeenCalledWith(
      "[reportMessage:info]",
      "hi",
      { foo: "bar" }
    )
  })

  it("omits the context arg when none is provided", () => {
    reportMessage("hi", "warning")
    expect(warnSpy).toHaveBeenCalledWith("[reportMessage:warning]", "hi")
  })
})
