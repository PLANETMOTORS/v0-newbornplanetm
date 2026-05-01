import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import {
  fetchWithTimeout,
  normaliseVin,
  readJsonAndValidate,
} from "@/lib/carfax/http"
import { FIXTURE_VIN, jsonResponse } from "@/__tests__/fixtures/carfax"

describe("normaliseVin", () => {
  it("uppercases + trims a valid VIN", () => {
    expect(normaliseVin("  1c6srfht6nn159638  ")).toBe(FIXTURE_VIN)
  })

  it("rejects VINs containing I/O/Q (forbidden NA characters)", () => {
    expect(normaliseVin("1C6SRFHT6NN1596I3")).toBeNull()
  })

  it("rejects too-short VINs", () => {
    expect(normaliseVin("1C6SRFHT6NN")).toBeNull()
  })

  it("rejects too-long VINs", () => {
    expect(normaliseVin("1C6SRFHT6NN159638EXTRA")).toBeNull()
  })
})

describe("fetchWithTimeout", () => {
  it("returns ok(response) on a quick fetch", async () => {
    const mock = vi.fn().mockResolvedValue(new Response("hi", { status: 200 }))
    const r = await fetchWithTimeout(mock as unknown as typeof fetch, "https://x", { method: "GET" }, 5_000)
    expect(r.ok).toBe(true)
  })

  it("returns timeout + aborts the underlying fetch when slow", async () => {
    let abortReceived = false
    const mock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            abortReceived = true
            reject(new DOMException("aborted", "AbortError"))
          })
        }),
    )
    const r = await fetchWithTimeout(mock as unknown as typeof fetch, "https://x", { method: "GET" }, 50)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("timeout")
    expect(abortReceived).toBe(true)
  })

  it("returns network error on a thrown TypeError", async () => {
    const mock = vi.fn().mockRejectedValue(new TypeError("ECONNRESET"))
    const r = await fetchWithTimeout(mock as unknown as typeof fetch, "https://x", { method: "GET" }, 5_000)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("network")
      if (r.error.kind === "network") expect(r.error.message).toContain("ECONNRESET")
    }
  })
})

describe("readJsonAndValidate", () => {
  const schema = z.object({ ok: z.boolean(), value: z.number() }).strict()

  it("returns the parsed value on a 200 with matching JSON", async () => {
    const r = await readJsonAndValidate(jsonResponse({ ok: true, value: 1 }), schema)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ ok: true, value: 1 })
  })

  it("returns http-error on a 4xx/5xx and truncates the body to 500 chars", async () => {
    const huge = "X".repeat(2_000)
    const r = await readJsonAndValidate(new Response(huge, { status: 502 }), schema)
    expect(r.ok).toBe(false)
    if (!r.ok && r.error.kind === "http-error") {
      expect(r.error.status).toBe(502)
      expect(r.error.body.length).toBe(500)
    }
  })

  it("returns non-json on a body that is not JSON", async () => {
    const r = await readJsonAndValidate(new Response("plain text", { status: 200 }), schema)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("non-json")
  })

  it("returns schema-mismatch on JSON that fails Zod", async () => {
    const r = await readJsonAndValidate(jsonResponse({ ok: "yes", value: "x" }), schema)
    expect(r.ok).toBe(false)
    if (!r.ok && r.error.kind === "schema-mismatch") {
      expect(r.error.issues).toContain("ok")
    }
  })
})
