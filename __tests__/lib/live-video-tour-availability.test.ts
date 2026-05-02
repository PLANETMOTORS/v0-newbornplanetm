import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  isDealershipOpen,
  getAvailableDates,
  getAvailableSlots,
  isWithinBusinessHours,
  checkSlotAvailability,
  normalizeIsoDate,
} from "@/lib/liveVideoTour/availability"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("normalizeIsoDate", () => {
  it("normalises a valid ISO date", () => {
    expect(normalizeIsoDate("2025-04-01")).toBe("2025-04-01")
  })

  it("rejects malformed dates", () => {
    expect(normalizeIsoDate("not-a-date")).toBeNull()
    expect(normalizeIsoDate("2025-13-01")).toBeNull()
    expect(normalizeIsoDate("2025-02-30")).toBeNull()
  })
})

describe("isDealershipOpen", () => {
  it("returns false on Sunday (closed day)", () => {
    // 2025-04-06 is a Sunday — dealership closed
    vi.setSystemTime(new Date("2025-04-06T15:00:00-04:00"))
    expect(isDealershipOpen()).toBe(false)
  })

  it("returns true during weekday business hours", () => {
    // Monday afternoon
    vi.setSystemTime(new Date("2025-04-07T15:00:00-04:00"))
    expect(isDealershipOpen()).toBe(true)
  })

  it("returns false outside business hours on a weekday", () => {
    // Monday 6am — before opening
    vi.setSystemTime(new Date("2025-04-07T06:00:00-04:00"))
    expect(isDealershipOpen()).toBe(false)
  })
})

describe("getAvailableSlots", () => {
  it("returns empty array for a closed day", () => {
    vi.setSystemTime(new Date("2025-04-01T10:00:00-04:00"))
    expect(getAvailableSlots("2025-04-06")).toEqual([]) // Sunday
  })

  it("returns slots with time/label/available for an open day", () => {
    vi.setSystemTime(new Date("2025-04-01T10:00:00-04:00"))
    const slots = getAvailableSlots("2025-04-07") // Monday
    expect(slots.length).toBeGreaterThan(0)
    for (const s of slots) {
      expect(s.time).toMatch(/^\d{2}:\d{2}$/)
      expect(s.label).toMatch(/(a\.m\.|p\.m\.)/)
      expect(typeof s.available).toBe("boolean")
    }
  })

  it("marks past slots unavailable on the same day", () => {
    // Set time to 2pm Monday - earlier slots should be unavailable
    vi.setSystemTime(new Date("2025-04-07T14:00:00-04:00"))
    const slots = getAvailableSlots("2025-04-07")
    const morningSlot = slots.find((s) => s.time === "10:00")
    expect(morningSlot?.available).toBe(false)
  })
})

describe("getAvailableDates", () => {
  it("returns at most MAX_ADVANCE_DAYS open dates", () => {
    vi.setSystemTime(new Date("2025-04-01T10:00:00-04:00"))
    const dates = getAvailableDates()
    expect(dates.length).toBeLessThanOrEqual(14)
    expect(dates.length).toBeGreaterThan(0)
    for (const d of dates) {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(d.dayLabel).toBeTruthy()
      expect(d.slots.every((s) => s.available)).toBe(true)
    }
  })
})

describe("isWithinBusinessHours", () => {
  it("rejects Sunday", () => {
    const sunday = new Date("2025-04-06T15:00:00-04:00")
    const r = isWithinBusinessHours(sunday)
    expect(r.valid).toBe(false)
    expect(r.error).toContain("Sunday")
  })

  it("rejects times outside open/close window", () => {
    const earlyMonday = new Date("2025-04-07T06:00:00-04:00")
    const r = isWithinBusinessHours(earlyMonday)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/available/)
  })

  it("rejects past datetimes", () => {
    vi.setSystemTime(new Date("2025-04-07T15:00:00-04:00"))
    const past = new Date("2024-01-01T15:00:00-04:00")
    const r = isWithinBusinessHours(past)
    expect(r.valid).toBe(false)
  })

  it("accepts a valid future weekday afternoon", () => {
    vi.setSystemTime(new Date("2025-04-01T10:00:00-04:00"))
    const future = new Date("2025-04-07T15:00:00-04:00")
    const r = isWithinBusinessHours(future)
    expect(r.valid).toBe(true)
  })
})

describe("checkSlotAvailability", () => {
  it("returns false for a closed Sunday", async () => {
    vi.useRealTimers()
    expect(await checkSlotAvailability(new Date("2099-04-05T15:00:00-04:00").toISOString())).toBe(false)
  })

  it("returns true for a valid future weekday slot", async () => {
    vi.useRealTimers()
    // 2099 is a future year — pick a Monday
    expect(await checkSlotAvailability(new Date("2099-04-06T15:00:00-04:00").toISOString())).toBe(true)
  })
})
