import { describe, expect, it, vi } from "vitest"
import {
  getCachedSummary,
  isCacheFresh,
  upsertSummary,
} from "@/lib/carfax/repository"
import type { CarfaxBadgeSummary } from "@/lib/carfax/schemas"

const SUMMARY: CarfaxBadgeSummary = {
  vin: "1C6SRFHT6NN159638",
  hasBadge: true,
  hasCpoBadge: false,
  hasApoBadge: false,
  badges: [
    {
      name: "AccidentFree",
      type: 1,
      imageUrl: "https://cdn.carfax.ca/badging/v3/en/AccidentFree.svg",
    },
  ],
  badgesImageUrl: "https://cdn.carfax.ca/badging/v3/en/Logo_AccidentFree.svg",
  vhrReportUrl: "https://vhr.carfax.ca/?id=abc",
  reportNumber: 1234,
  hoverHtml: null,
  hasReport: true,
  resultCode: 1,
  resultMessage: "Successful",
  fetchedAt: "2026-05-01T12:00:00.000Z",
}

function clientWithSelect(value: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(value)
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn(() => ({ select, upsert }))
  return { from, select, eq, maybeSingle, upsert }
}

describe("getCachedSummary", () => {
  it("returns ok(payload) on a found row", async () => {
    const c = clientWithSelect({ data: { vin: SUMMARY.vin, payload: SUMMARY }, error: null })
    const r = await getCachedSummary(SUMMARY.vin, () => c as never)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value?.vin).toBe(SUMMARY.vin)
  })

  it("returns ok(null) when no row exists (success path)", async () => {
    const c = clientWithSelect({ data: null, error: null })
    const r = await getCachedSummary(SUMMARY.vin, () => c as never)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBeNull()
  })

  it("returns err on db-error", async () => {
    const c = clientWithSelect({
      data: null,
      error: { message: "rls denied", code: "42501" },
    })
    const r = await getCachedSummary(SUMMARY.vin, () => c as never)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.kind).toBe("db-error")
      if (r.error.kind === "db-error") {
        expect(r.error.message).toBe("rls denied")
        expect(r.error.code).toBe("42501")
      }
    }
  })

  it("catches thrown exceptions into err", async () => {
    const factory = () => {
      throw new Error("connect refused")
    }
    const r = await getCachedSummary(SUMMARY.vin, factory as never)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})

describe("upsertSummary", () => {
  it("calls upsert with vin onConflict and returns ok(summary)", async () => {
    const c = clientWithSelect({ data: null, error: null })
    const r = await upsertSummary(SUMMARY, () => c as never)
    expect(r.ok).toBe(true)
    expect(c.from).toHaveBeenCalledWith("carfax_cache")
    expect(c.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        vin: SUMMARY.vin,
        has_report: true,
        result_code: 1,
        fetched_at: SUMMARY.fetchedAt,
      }),
      { onConflict: "vin" },
    )
  })

  it("returns err on db-error", async () => {
    const c = {
      from: vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({
          error: { message: "duplicate", code: "23505" },
        }),
      })),
    }
    const r = await upsertSummary(SUMMARY, () => c as never)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("db-error")
  })

  it("catches thrown exceptions into err", async () => {
    const factory = () => {
      throw new Error("network down")
    }
    const r = await upsertSummary(SUMMARY, factory as never)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.kind).toBe("exception")
  })
})

describe("isCacheFresh", () => {
  const now = Date.parse("2026-05-02T12:00:00.000Z")

  it("returns true within the default 24h TTL", () => {
    const fresh: CarfaxBadgeSummary = { ...SUMMARY, fetchedAt: "2026-05-01T13:00:00.000Z" }
    expect(isCacheFresh(fresh, now)).toBe(true)
  })

  it("returns false past the 24h TTL", () => {
    const stale: CarfaxBadgeSummary = { ...SUMMARY, fetchedAt: "2026-04-30T11:00:00.000Z" }
    expect(isCacheFresh(stale, now)).toBe(false)
  })

  it("respects a custom TTL", () => {
    const oneHourAgo: CarfaxBadgeSummary = {
      ...SUMMARY,
      fetchedAt: "2026-05-02T11:00:00.000Z",
    }
    expect(isCacheFresh(oneHourAgo, now, 30 * 60 * 1_000)).toBe(false)
    expect(isCacheFresh(oneHourAgo, now, 2 * 60 * 60 * 1_000)).toBe(true)
  })

  it("returns false on unparseable fetchedAt (defensive)", () => {
    const broken: CarfaxBadgeSummary = { ...SUMMARY, fetchedAt: "not-a-date" }
    expect(isCacheFresh(broken, now)).toBe(false)
  })
})
