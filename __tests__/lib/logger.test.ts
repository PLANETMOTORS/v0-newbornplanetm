import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

let originalNodeEnv: string | undefined

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV
  vi.resetModules()
})

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv
  vi.restoreAllMocks()
})

async function loadLogger() {
  return (await import("@/lib/logger")).logger
}

describe("lib/logger — non-production (debug + info emitted)", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development"
  })

  it("debug() forwards to console.log with timestamp prefix", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.debug("hello", 1)
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toMatch(/DEBUG/)
    expect(log.mock.calls[0][1]).toBe("hello")
    expect(log.mock.calls[0][2]).toBe(1)
  })

  it("info() forwards to console.info with INFO tag", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.info("milestone")
    expect(info).toHaveBeenCalled()
    expect(info.mock.calls[0][0]).toMatch(/INFO /)
  })

  it("warn() always forwards to console.warn with WARN tag", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.warn("careful")
    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls[0][0]).toMatch(/WARN /)
  })

  it("error() always forwards to console.error with ERROR tag", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.error("failed")
    expect(error).toHaveBeenCalled()
    expect(error.mock.calls[0][0]).toMatch(/ERROR/)
  })
})

describe("lib/logger — production (debug + info suppressed)", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production"
  })

  it("debug() is a no-op in production", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.debug("noisy")
    expect(log).not.toHaveBeenCalled()
  })

  it("info() is a no-op in production", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.info("noisy")
    expect(info).not.toHaveBeenCalled()
  })

  it("warn() still emits in production", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.warn("careful")
    expect(warn).toHaveBeenCalled()
  })

  it("error() still emits in production", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.error("failed")
    expect(error).toHaveBeenCalled()
  })
})

describe("lib/logger — timestamp format", () => {
  it("prefixes ISO-8601 timestamps", async () => {
    process.env.NODE_ENV = "development"
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const logger = await loadLogger()
    logger.warn("x")
    const prefix = warn.mock.calls[0][0] as string
    expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
