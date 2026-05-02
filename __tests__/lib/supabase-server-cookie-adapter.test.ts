/**
 * Coverage lock for lib/supabase/server.ts createClient cookie adapter.
 *
 * Round 9 introduced an explicit CookieMethodsServer adapter (getAll/setAll)
 * to dispel the deprecated `(url, key, options: any)` createServerClient
 * overload (S1874). These tests exercise both adapter callbacks so the
 * new lines are covered in SonarCloud's new-code report.
 */

import { describe, expect, it, vi, beforeEach } from "vitest"

const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-access", value: "tok" }]),
  set: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url: string, _key: string, opts: { cookies: { getAll: () => unknown; setAll: (rows: unknown) => void } }) => ({
    __cookieAdapter: opts.cookies,
  })),
}))

describe("lib/supabase/server createClient cookie adapter", () => {
  beforeEach(() => {
    cookieStore.getAll.mockClear()
    cookieStore.set.mockClear()
  })

  it("forwards getAll() to the Next.js cookieStore", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    const sb = (await createClient()) as unknown as { __cookieAdapter: { getAll: () => unknown[] } }
    const all = sb.__cookieAdapter.getAll()
    expect(cookieStore.getAll).toHaveBeenCalled()
    expect(all).toEqual([{ name: "sb-access", value: "tok" }])
  })

  it("forwards setAll() to cookieStore.set with each row's name/value/options", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    const sb = (await createClient()) as unknown as { __cookieAdapter: { setAll: (rows: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void } }
    sb.__cookieAdapter.setAll([
      { name: "sb-a", value: "v1", options: { path: "/" } },
      { name: "sb-b", value: "v2", options: { path: "/auth" } },
    ])
    expect(cookieStore.set).toHaveBeenCalledTimes(2)
    expect(cookieStore.set).toHaveBeenNthCalledWith(1, "sb-a", "v1", { path: "/" })
    expect(cookieStore.set).toHaveBeenNthCalledWith(2, "sb-b", "v2", { path: "/auth" })
  })
})
