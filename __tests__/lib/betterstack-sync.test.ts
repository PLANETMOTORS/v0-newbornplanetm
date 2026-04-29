/**
 * __tests__/lib/betterstack-sync.test.ts
 *
 * Coverage for lib/monitoring/betterstack-sync.ts. We hand-roll the fetch
 * mock so we can assert exact URLs, methods, and JSON bodies.
 */

import { describe, expect, it, vi } from "vitest"
import {
  API_BASE,
  buildMonitors,
  formatSummary,
  listExistingMonitors,
  runCli,
  syncAllMonitors,
  syncMonitor,
  type FetchLike,
  type MonitorRecord,
  type MonitorSpec,
  type SyncDeps,
} from "@/lib/monitoring/betterstack-sync"

function jsonResponse(body: unknown, init: Partial<ResponseInit> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

function errorResponse(status: number, text = "boom"): Response {
  return new Response(text, { status })
}

const TOKEN = "secret-token"

describe("buildMonitors", () => {
  it("emits 6 monitors with stable names + correct URLs", () => {
    const monitors = buildMonitors("https://example.com")
    expect(monitors).toHaveLength(6)
    const names = monitors.map((m) => m.pronounceable_name)
    expect(names).toEqual([
      "Homepage",
      "Inventory",
      "API health probe",
      "Stripe webhook route",
      "Financing application",
      "Checkout entry",
    ])
    monitors.forEach((m) => expect(m.url.startsWith("https://example.com")).toBe(true))
  })

  it("requires the homepage keyword 'Battery-Health Certified'", () => {
    const homepage = buildMonitors("https://x").find((m) => m.pronounceable_name === "Homepage")
    expect(homepage?.required_keyword).toBe("Battery-Health Certified")
    expect(homepage?.monitor_type).toBe("keyword")
  })

  it("uses 405 as the expected status code for the Stripe webhook (proves route exists)", () => {
    const stripeMonitor = buildMonitors("https://x").find(
      (m) => m.pronounceable_name === "Stripe webhook route",
    )
    expect(stripeMonitor?.expected_status_codes).toEqual([405])
  })
})

describe("listExistingMonitors", () => {
  it("returns the monitors from a single page", async () => {
    const fakeFetch = vi.fn(async () =>
      jsonResponse({
        data: [
          { id: "1", attributes: { pronounceable_name: "Homepage", url: "https://x/" } },
        ],
      }),
    ) as unknown as FetchLike

    const records = await listExistingMonitors({ fetch: fakeFetch, token: TOKEN })
    expect(records).toHaveLength(1)
    expect(records[0]?.id).toBe("1")
  })

  it("paginates through multiple pages", async () => {
    const calls: string[] = []
    const fakeFetch = vi.fn(async (url: string) => {
      calls.push(url)
      if (calls.length === 1) {
        return jsonResponse({
          data: [{ id: "a", attributes: { pronounceable_name: "Homepage", url: "https://x/" } }],
          pagination: { next: `${API_BASE}/monitors?page=2` },
        })
      }
      return jsonResponse({
        data: [{ id: "b", attributes: { pronounceable_name: "Inventory", url: "https://x/inventory" } }],
        pagination: { next: null },
      })
    }) as unknown as FetchLike

    const records = await listExistingMonitors({ fetch: fakeFetch, token: TOKEN })
    expect(records.map((r) => r.id)).toEqual(["a", "b"])
    expect(calls).toHaveLength(2)
  })

  it("throws a helpful error on non-2xx responses", async () => {
    const fakeFetch = vi.fn(async () => errorResponse(401)) as unknown as FetchLike
    await expect(listExistingMonitors({ fetch: fakeFetch, token: TOKEN })).rejects.toThrow(
      /Better Stack list failed: HTTP 401/,
    )
  })
})

describe("syncMonitor", () => {
  const baseSpec: MonitorSpec = {
    pronounceable_name: "Homepage",
    url: "https://x/",
    monitor_type: "keyword",
    required_keyword: "ok",
    check_frequency: 60,
  }

  it("creates a new monitor when none matches", async () => {
    const fakeFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(`${API_BASE}/monitors`)
      expect(init?.method).toBe("POST")
      const body = JSON.parse(String(init?.body)) as MonitorSpec
      expect(body.pronounceable_name).toBe("Homepage")
      return jsonResponse({ data: { id: "new-id" } })
    }) as unknown as FetchLike

    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: false }
    const result = await syncMonitor(baseSpec, [], deps)
    expect(result).toEqual({ monitor: "Homepage", action: "created", id: "new-id" })
  })

  it("updates an existing monitor when name + url match", async () => {
    const existing: MonitorRecord[] = [
      { id: "existing-id", attributes: { pronounceable_name: "Homepage", url: "https://x/" } },
    ]
    const fakeFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(`${API_BASE}/monitors/existing-id`)
      expect(init?.method).toBe("PATCH")
      return jsonResponse({})
    }) as unknown as FetchLike

    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: false }
    const result = await syncMonitor(baseSpec, existing, deps)
    expect(result).toEqual({ monitor: "Homepage", action: "updated", id: "existing-id" })
  })

  it("respects dryRun by not calling fetch on create", async () => {
    const fakeFetch = vi.fn() as unknown as FetchLike
    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: true }
    const result = await syncMonitor(baseSpec, [], deps)
    expect(result.action).toBe("created")
    expect(result.id).toBe("dry-run")
    expect(fakeFetch).not.toHaveBeenCalled()
  })

  it("respects dryRun by not calling fetch on update", async () => {
    const existing: MonitorRecord[] = [
      { id: "existing-id", attributes: { pronounceable_name: "Homepage", url: "https://x/" } },
    ]
    const fakeFetch = vi.fn() as unknown as FetchLike
    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: true }
    const result = await syncMonitor(baseSpec, existing, deps)
    expect(result.action).toBe("updated")
    expect(fakeFetch).not.toHaveBeenCalled()
  })

  it("surfaces the response body when create fails", async () => {
    const fakeFetch = vi.fn(async () => errorResponse(422, "name taken")) as unknown as FetchLike
    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: false }
    await expect(syncMonitor(baseSpec, [], deps)).rejects.toThrow(/HTTP 422 — name taken/)
  })

  it("surfaces the response body when update fails", async () => {
    const existing: MonitorRecord[] = [
      { id: "existing-id", attributes: { pronounceable_name: "Homepage", url: "https://x/" } },
    ]
    const fakeFetch = vi.fn(async () => errorResponse(500, "kaboom")) as unknown as FetchLike
    const deps: SyncDeps = { fetch: fakeFetch, token: TOKEN, dryRun: false }
    await expect(syncMonitor(baseSpec, existing, deps)).rejects.toThrow(/HTTP 500 — kaboom/)
  })
})

describe("syncAllMonitors", () => {
  it("creates each spec in turn when nothing exists", async () => {
    const fakeFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) {
        return jsonResponse({ data: [], pagination: { next: null } })
      }
      const body = JSON.parse(String(init.body)) as MonitorSpec
      return jsonResponse({ data: { id: `id-${body.pronounceable_name}` } })
    }) as unknown as FetchLike

    const specs = buildMonitors("https://x")
    const results = await syncAllMonitors(specs, { fetch: fakeFetch, token: TOKEN, dryRun: false })
    expect(results).toHaveLength(specs.length)
    expect(results.every((r) => r.action === "created")).toBe(true)
  })
})

describe("formatSummary", () => {
  it("renders a counted, indented summary", () => {
    const out = formatSummary([
      { monitor: "Homepage", action: "created", id: "a" },
      { monitor: "Inventory", action: "updated", id: "b" },
    ])
    expect(out).toContain("created  Homepage  (id=a)")
    expect(out).toContain("updated  Inventory  (id=b)")
    expect(out).toContain("Total: 2 (created=1, updated=1)")
  })
})

describe("runCli", () => {
  function captureStreams() {
    const out: string[] = []
    const err: string[] = []
    return {
      stdout: (chunk: string) => out.push(chunk),
      stderr: (chunk: string) => err.push(chunk),
      out,
      err,
    }
  }

  it("returns exit code 2 when BETTER_STACK_API_TOKEN is missing", async () => {
    const streams = captureStreams()
    const code = await runCli({
      env: {},
      fetchImpl: vi.fn() as unknown as FetchLike,
      stdout: streams.stdout,
      stderr: streams.stderr,
    })
    expect(code).toBe(2)
    expect(streams.err.join("")).toMatch(/BETTER_STACK_API_TOKEN is required/)
  })

  it("returns exit code 0 on a successful sync and prints the summary", async () => {
    const streams = captureStreams()
    const fakeFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) {
        return jsonResponse({ data: [], pagination: { next: null } })
      }
      const body = JSON.parse(String(init.body)) as MonitorSpec
      return jsonResponse({ data: { id: `id-${body.pronounceable_name}` } })
    }) as unknown as FetchLike

    const code = await runCli({
      env: { BETTER_STACK_API_TOKEN: TOKEN, BASE_URL: "https://x", DRY_RUN: "0" },
      fetchImpl: fakeFetch,
      stdout: streams.stdout,
      stderr: streams.stderr,
    })
    expect(code).toBe(0)
    expect(streams.out.join("")).toContain("Total: 6")
  })

  it("returns exit code 0 on a dry-run sync without making POST calls", async () => {
    const streams = captureStreams()
    const fakeFetch = vi.fn(async () =>
      jsonResponse({ data: [], pagination: { next: null } }),
    ) as unknown as FetchLike

    const code = await runCli({
      env: { BETTER_STACK_API_TOKEN: TOKEN, DRY_RUN: "1" },
      fetchImpl: fakeFetch,
      stdout: streams.stdout,
      stderr: streams.stderr,
    })
    expect(code).toBe(0)
    expect(streams.out.join("")).toContain("created")
    // Only the LIST call goes out; create/update are skipped.
    expect(fakeFetch).toHaveBeenCalledTimes(1)
  })

  it("returns exit code 1 with the error message when the API errors", async () => {
    const streams = captureStreams()
    const fakeFetch = vi.fn(async () => errorResponse(500, "down")) as unknown as FetchLike

    const code = await runCli({
      env: { BETTER_STACK_API_TOKEN: TOKEN },
      fetchImpl: fakeFetch,
      stdout: streams.stdout,
      stderr: streams.stderr,
    })
    expect(code).toBe(1)
    expect(streams.err.join("")).toMatch(/Better Stack sync failed: Better Stack list failed: HTTP 500/)
  })

  it("returns exit code 1 when fetch itself rejects with a non-Error value", async () => {
    const streams = captureStreams()
    const fakeFetch = vi.fn(async () => {
      throw "string failure"
    }) as unknown as FetchLike

    const code = await runCli({
      env: { BETTER_STACK_API_TOKEN: TOKEN },
      fetchImpl: fakeFetch,
      stdout: streams.stdout,
      stderr: streams.stderr,
    })
    expect(code).toBe(1)
    expect(streams.err.join("")).toMatch(/string failure/)
  })
})
