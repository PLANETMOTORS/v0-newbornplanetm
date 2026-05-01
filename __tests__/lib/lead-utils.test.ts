import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { timeAgo, sourceIcon, leadStatusVariant } from "@/lib/admin/lead-utils"
import { Bot, Car, CalendarCheck, Clock, DollarSign, Mail, MessageSquare } from "lucide-react"

describe("timeAgo", () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-28T12:00:00Z"))
  })
  afterAll(() => vi.useRealTimers())

  it("returns 'just now' for <60s", () => {
    expect(timeAgo("2026-04-28T11:59:30Z")).toBe("just now")
  })

  it("returns minutes for <1h", () => {
    expect(timeAgo("2026-04-28T11:30:00Z")).toBe("30m ago")
  })

  it("returns hours for <1d", () => {
    expect(timeAgo("2026-04-28T08:00:00Z")).toBe("4h ago")
  })

  it("returns days otherwise", () => {
    expect(timeAgo("2026-04-25T12:00:00Z")).toBe("3d ago")
  })
})

describe("sourceIcon", () => {
  it.each([
    ["contact_form", MessageSquare],
    ["chat", Bot],
    ["finance_app", DollarSign],
    ["reservation", CalendarCheck],
    ["trade_in", Car],
    ["test_drive", Clock],
    ["newsletter", Mail],
    ["unknown", MessageSquare],
  ])("maps %s to the right icon", (source, expected) => {
    expect(sourceIcon(source)).toBe(expected)
  })
})

describe("leadStatusVariant", () => {
  it("maps known statuses", () => {
    expect(leadStatusVariant("new")).toBe("default")
    expect(leadStatusVariant("contacted")).toBe("secondary")
    expect(leadStatusVariant("qualified")).toBe("outline")
    expect(leadStatusVariant("converted")).toBe("default")
    expect(leadStatusVariant("lost")).toBe("destructive")
  })

  it("falls back to secondary for unknown statuses", () => {
    expect(leadStatusVariant("anything-else")).toBe("secondary")
  })
})
