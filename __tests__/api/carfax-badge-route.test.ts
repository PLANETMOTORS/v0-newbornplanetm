import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.resetModules()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

function makeReq(url: string | null): NextRequest {
  const base = "http://localhost/api/v1/carfax/badge"
  const full = url ? `${base}?url=${encodeURIComponent(url)}` : base
  return new NextRequest(full, { method: "GET" })
}

describe("GET /api/v1/carfax/badge", () => {
  it("returns 400 when ?url= is missing", async () => {
    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq(null) as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Missing/)
  })

  it("returns 400 for an invalid URL", async () => {
    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq("not-a-url") as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid/)
  })

  it("returns 403 for non-carfax hostname", async () => {
    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq("https://evil.com/badge.svg") as never)
    expect(res.status).toBe(403)
  })

  it("proxies a valid cdn.carfax.ca SVG with correct headers", async () => {
    const svgBody = "<svg></svg>"
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(svgBody, {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      })
    ) as unknown as typeof fetch

    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq("https://cdn.carfax.ca/badging/v3/en/Logo.svg") as never)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml")
    expect(res.headers.get("Cache-Control")).toContain("public")
  })

  it("returns 502 when upstream returns a non-ok status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("Not Found", { status: 404 })
    ) as unknown as typeof fetch

    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq("https://cdn.carfax.ca/badging/v3/en/Missing.svg") as never)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/Upstream/)
  })

  it("returns 502 when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error("Network error")
    ) as unknown as typeof fetch

    const { GET } = await import("@/app/api/v1/carfax/badge/route")
    const res = await GET(makeReq("https://cdn.carfax.ca/badging/v3/en/Logo.svg") as never)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/Failed to fetch/)
  })
})
