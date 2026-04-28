import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  vi.resetModules()
  vi.unstubAllGlobals()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.unstubAllGlobals()
})

describe("lib/supabase/edge-functions getEdgeFunctionBaseUrl", () => {
  it("returns `<base>/functions/v1` when the URL has no trailing slash", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    const { getEdgeFunctionBaseUrl } = await import("@/lib/supabase/edge-functions")
    expect(getEdgeFunctionBaseUrl()).toBe("https://abc.supabase.co/functions/v1")
  })

  it("strips a trailing slash from the URL before appending /functions/v1", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co/"
    const { getEdgeFunctionBaseUrl } = await import("@/lib/supabase/edge-functions")
    expect(getEdgeFunctionBaseUrl()).toBe("https://abc.supabase.co/functions/v1")
  })

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    const { getEdgeFunctionBaseUrl } = await import("@/lib/supabase/edge-functions")
    expect(() => getEdgeFunctionBaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })
})

describe("lib/supabase/edge-functions invokeEdgeFunction", () => {
  function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
    const fetchMock = vi.fn(impl)
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")
    await expect(invokeEdgeFunction("capture-lead", { foo: 1 })).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    )
  })

  it("calls fetch with anon-key bearer when no accessToken is provided", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    const fetchMock = mockFetch(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")

    const result = await invokeEdgeFunction<{ ok: boolean }>("capture-lead", { foo: 1 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://abc.supabase.co/functions/v1/capture-lead")
    expect(init.method).toBe("POST")
    const headers = init.headers as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers.apikey).toBe("anon-123")
    expect(headers.Authorization).toBe("Bearer anon-123")
    expect(init.body).toBe(JSON.stringify({ foo: 1 }))
    expect(result).toEqual({ data: { ok: true }, status: 200 })
  })

  it("uses the user's access token when provided", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    const fetchMock = mockFetch(async () =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")
    await invokeEdgeFunction("hello", {}, { accessToken: "user-jwt" })
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe("Bearer user-jwt")
    expect(headers.apikey).toBe("anon-123")
  })

  it("returns parsed JSON error body with status when response is not ok and body is JSON", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    mockFetch(async () =>
      new Response(JSON.stringify({ error: "validation_failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")
    const out = await invokeEdgeFunction<{ error: string }>("capture-lead", {})
    expect(out).toEqual({ data: { error: "validation_failed" }, status: 400 })
  })

  it("throws a descriptive error when response is not ok and body is non-JSON", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    mockFetch(async () => new Response("Internal Server Error", { status: 500 }))
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")
    await expect(invokeEdgeFunction("hello", {})).rejects.toThrow(
      /Edge Function hello returned 500/,
    )
  })

  it("truncates very long non-JSON error bodies in the thrown message", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-123"
    const long = "x".repeat(500)
    mockFetch(async () => new Response(long, { status: 502 }))
    const { invokeEdgeFunction } = await import("@/lib/supabase/edge-functions")
    let caught = ""
    try {
      await invokeEdgeFunction("hello", {})
    } catch (err) {
      caught = (err as Error).message
    }
    expect(caught).toMatch(/^Edge Function hello returned 502: /)
    // 200-char slice + prefix
    expect(caught.length).toBeLessThan(300)
  })
})
