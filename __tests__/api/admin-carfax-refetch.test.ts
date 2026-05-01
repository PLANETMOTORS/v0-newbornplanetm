/**
 * Admin route coverage for POST /api/v1/admin/carfax/[vin]/refetch.
 * Specifically locks down two compliance/observability requirements:
 *
 *   - Error responses MUST NOT echo internal database error messages
 *     to the client (production fallbacks stay generic; details live
 *     in the server log only).
 *   - Logger payloads MUST NOT include user PII like the requester's
 *     email; we log `role` instead.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import {
  FIXTURE_ENV,
  FIXTURE_SUMMARY,
  FIXTURE_VIN,
} from "@/__tests__/fixtures/carfax"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

const requirePermissionMock = vi.fn()
vi.mock("@/lib/security/admin-route-helpers", () => ({
  requirePermission: (...args: unknown[]) => requirePermissionMock(...args),
}))

const fetchBadgesMock = vi.fn()
vi.mock("@/lib/carfax/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/carfax/client")>(
    "@/lib/carfax/client",
  )
  return {
    ...actual,
    fetchBadges: (...args: unknown[]) => fetchBadgesMock(...args),
  }
})

const upsertSummaryMock = vi.fn()
vi.mock("@/lib/carfax/repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/carfax/repository")
  >("@/lib/carfax/repository")
  return {
    ...actual,
    upsertSummary: (...args: unknown[]) => upsertSummaryMock(...args),
  }
})

vi.mock("@/lib/carfax/env", () => ({
  readCarfaxEnv: () => FIXTURE_ENV,
}))

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
vi.mock("@/lib/logger", () => ({ logger: loggerMock }))

const ADMIN_EMAIL = "owner@planetmotors.example"

function makeReq(): NextRequest {
  return new NextRequest(`http://localhost/api/v1/admin/carfax/${FIXTURE_VIN}/refetch`, {
    method: "POST",
  })
}

const ctx = (vin: string) => ({ params: Promise.resolve({ vin }) })

beforeEach(() => {
  vi.clearAllMocks()
  requirePermissionMock.mockResolvedValue({
    ok: true,
    value: {
      email: ADMIN_EMAIL,
      role: "admin",
      source: "env",
      permissions: {} as never,
    },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("POST /api/v1/admin/carfax/[vin]/refetch", () => {
  it("forwards permission failures untouched", async () => {
    const denied = NextResponse.json({ error: "forbidden" }, { status: 403 })
    requirePermissionMock.mockResolvedValueOnce({ ok: false, error: denied })
    const { POST } = await import("@/app/api/v1/admin/carfax/[vin]/refetch/route")
    const res = await POST(makeReq(), ctx(FIXTURE_VIN))
    expect(res.status).toBe(403)
  })

  it("returns the live summary on a clean refetch", async () => {
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FIXTURE_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({ ok: true, value: FIXTURE_SUMMARY })
    const { POST } = await import("@/app/api/v1/admin/carfax/[vin]/refetch/route")
    const res = await POST(makeReq(), ctx(FIXTURE_VIN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary.vin).toBe(FIXTURE_VIN)
  })

  it("returns a STABLE error message on persistence failure (no DB internals leaked)", async () => {
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FIXTURE_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({
      ok: false,
      error: {
        kind: "db-error",
        message: "duplicate key value violates unique constraint \"carfax_cache_pkey\"",
        code: "23505",
      },
    })
    const { POST } = await import("@/app/api/v1/admin/carfax/[vin]/refetch/route")
    const res = await POST(makeReq(), ctx(FIXTURE_VIN))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe("CARFAX_PERSIST_FAILED")
    expect(body.error.message).toBe("Failed to persist Carfax data")
    // Critical: the raw Postgres internals must NEVER reach the client.
    expect(JSON.stringify(body)).not.toContain("duplicate key value")
    expect(JSON.stringify(body)).not.toContain("23505")
  })

  it("does NOT include the requester's email in any logger call (PII)", async () => {
    fetchBadgesMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: "http-error", status: 502, body: "bad gateway" },
    })
    const { POST } = await import("@/app/api/v1/admin/carfax/[vin]/refetch/route")
    await POST(makeReq(), ctx(FIXTURE_VIN))

    const allCalls = [
      ...loggerMock.info.mock.calls,
      ...loggerMock.warn.mock.calls,
      ...loggerMock.error.mock.calls,
    ]
    const serialised = JSON.stringify(allCalls)
    expect(serialised).not.toContain(ADMIN_EMAIL)
    // Sanity: we still log something useful — the role.
    expect(serialised).toContain("admin")
  })

  it("logs the requester role on success (still useful telemetry)", async () => {
    fetchBadgesMock.mockResolvedValueOnce({ ok: true, value: FIXTURE_SUMMARY })
    upsertSummaryMock.mockResolvedValueOnce({ ok: true, value: FIXTURE_SUMMARY })
    const { POST } = await import("@/app/api/v1/admin/carfax/[vin]/refetch/route")
    await POST(makeReq(), ctx(FIXTURE_VIN))
    expect(loggerMock.info).toHaveBeenCalledTimes(1)
    const payload = loggerMock.info.mock.calls[0][1] as Record<string, unknown>
    expect(payload).toMatchObject({ vin: FIXTURE_VIN, role: "admin" })
    expect(payload).not.toHaveProperty("by")
  })
})
