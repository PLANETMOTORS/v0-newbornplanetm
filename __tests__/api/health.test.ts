/**
 * __tests__/api/health.test.ts
 *
 * Unit tests for /api/health. We mock @/lib/neon/sql.getSql so the route
 * exercises every branch without touching a real database.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>

const sqlState = vi.hoisted(() => ({
  impl: null as SqlTag | null,
}))

vi.mock("@/lib/neon/sql", () => ({
  getSql: () => sqlState.impl,
}))

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { GET } = await import("@/app/api/health/route")

function fakeSql(row: { vehicle_count: number; last_sync_at: string | null }): SqlTag {
  return (async () => [row]) as SqlTag
}

function throwingSql(message: string): SqlTag {
  return (async () => {
    throw new Error(message)
  }) as SqlTag
}

describe("GET /api/health", () => {
  beforeEach(() => {
    sqlState.impl = null
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-27T16:30:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 503 when DATABASE_URL is unconfigured", async () => {
    sqlState.impl = null
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.checks.homenet_sync.error).toBe("db_unconfigured")
    expect(body.checks.inventory.error).toBe("db_unconfigured")
  })

  it("returns 503 and redacts the underlying error when the SQL query throws", async () => {
    sqlState.impl = throwingSql("connection refused at 10.0.0.5:5432")
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.homenet_sync.error).toBe("db_error")
    expect(body.checks.inventory.error).toBe("db_error")
    expect(JSON.stringify(body)).not.toContain("connection refused")
    expect(JSON.stringify(body)).not.toContain("10.0.0.5")
  })

  it("returns 503 when inventory is empty and no sync has happened", async () => {
    sqlState.impl = fakeSql({ vehicle_count: 0, last_sync_at: null })
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.inventory.error).toBe("empty_inventory")
    expect(body.checks.inventory.vehicle_count).toBe(0)
    expect(body.checks.homenet_sync.error).toBe("no_sync_yet")
  })

  it("returns 503 when sync is stale (> 20 min) but inventory exists", async () => {
    sqlState.impl = fakeSql({
      vehicle_count: 247,
      last_sync_at: "2026-04-27T16:00:00.000Z",
    })
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.inventory.ok).toBe(true)
    expect(body.checks.inventory.vehicle_count).toBe(247)
    expect(body.checks.homenet_sync.ok).toBe(false)
    expect(body.checks.homenet_sync.error).toBe("sync_stale")
    expect(body.checks.homenet_sync.age_min).toBe(30)
    expect(body.checks.homenet_sync.max_age_min).toBe(20)
  })

  it("returns 200 when sync is fresh and inventory is non-empty", async () => {
    sqlState.impl = fakeSql({
      vehicle_count: 247,
      last_sync_at: "2026-04-27T16:25:00.000Z",
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.checks.homenet_sync.ok).toBe(true)
    expect(body.checks.homenet_sync.age_min).toBe(5)
    expect(body.checks.homenet_sync.max_age_min).toBe(20)
    expect(body.checks.inventory.vehicle_count).toBe(247)
    expect(typeof body.duration_ms).toBe("number")
    expect(body.checked_at).toBe("2026-04-27T16:30:00.000Z")
  })

  it("emits no-store cache headers on every response", async () => {
    sqlState.impl = fakeSql({
      vehicle_count: 247,
      last_sync_at: "2026-04-27T16:29:00.000Z",
    })
    const res = await GET()
    expect(res.headers.get("Cache-Control")).toBe("no-store, must-revalidate")
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex")
  })

  it("treats an empty SQL result as missing row (defaults vehicle_count=0, last_sync_at=null)", async () => {
    sqlState.impl = (async () => []) as SqlTag
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.inventory.error).toBe("empty_inventory")
    expect(body.checks.inventory.vehicle_count).toBe(0)
    expect(body.checks.homenet_sync.error).toBe("no_sync_yet")
  })

  it("treats sync exactly at the 20-minute boundary as fresh", async () => {
    sqlState.impl = fakeSql({
      vehicle_count: 100,
      last_sync_at: "2026-04-27T16:10:00.000Z",
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.checks.homenet_sync.ok).toBe(true)
    expect(body.checks.homenet_sync.age_min).toBe(20)
  })
})
