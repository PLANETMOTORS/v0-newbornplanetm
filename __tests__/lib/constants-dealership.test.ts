import { describe, it, expect } from "vitest"
import {
  DEALERSHIP_LOCATION,
  DEALERSHIP_ADDRESS_DISPLAY,
  DEALERSHIP_ADDRESS_FULL,
  PHONE_TOLL_FREE,
  PHONE_LOCAL,
  EMAIL_INFO,
  BUSINESS_HOURS,
  BUSINESS_HOURS_DISPLAY,
  BUSINESS_HOURS_SHORT,
  WEEKDAY_HOURS_FALLBACK,
  SATURDAY_HOURS_FALLBACK,
  WEEKDAY_HOURS_LONG,
  SATURDAY_HOURS_LONG,
  OPENING_HOURS_SPECIFICATION,
  DEALERSHIP_TIMEZONE,
  SUNDAY_CLOSED,
} from "@/lib/constants/dealership"

describe("constants/dealership", () => {
  it("has correct location info", () => {
    expect(DEALERSHIP_LOCATION.name).toBe("Planet Motors")
    expect(DEALERSHIP_LOCATION.city).toBe("Richmond Hill")
    expect(DEALERSHIP_LOCATION.province).toBe("ON")
    expect(typeof DEALERSHIP_LOCATION.lat).toBe("number")
    expect(typeof DEALERSHIP_LOCATION.lng).toBe("number")
  })

  it("formats display addresses", () => {
    expect(DEALERSHIP_ADDRESS_DISPLAY).toContain("Richmond Hill")
    expect(DEALERSHIP_ADDRESS_FULL).toContain("L4C 1G7")
  })

  it("has contact info", () => {
    expect(PHONE_TOLL_FREE).toContain("866")
    expect(PHONE_LOCAL).toContain("416")
    expect(EMAIL_INFO).toContain("@planetmotors.ca")
  })

  it("has business hours for weekdays", () => {
    for (let day = 1; day <= 5; day++) {
      expect(BUSINESS_HOURS[day]).not.toBeNull()
      expect(BUSINESS_HOURS[day]?.open).toBe(9)
    }
  })

  it("Sunday is closed", () => {
    expect(BUSINESS_HOURS[0]).toBeNull()
    expect(SUNDAY_CLOSED).toBe(true)
  })

  it("Saturday has different hours", () => {
    expect(BUSINESS_HOURS[6]?.close).toBe(18)
  })

  it("has timezone", () => {
    expect(DEALERSHIP_TIMEZONE).toBe("America/Toronto")
  })

  it("formats display strings", () => {
    expect(BUSINESS_HOURS_DISPLAY).toContain("Mon-Fri")
    expect(BUSINESS_HOURS_SHORT).toContain("Sat")
    expect(WEEKDAY_HOURS_FALLBACK).toContain("AM")
    expect(SATURDAY_HOURS_FALLBACK).toContain("PM")
    expect(WEEKDAY_HOURS_LONG).toContain("AM")
    expect(SATURDAY_HOURS_LONG).toContain("PM")
  })

  it("has JSON-LD opening hours spec", () => {
    expect(OPENING_HOURS_SPECIFICATION).toHaveLength(2)
    expect(OPENING_HOURS_SPECIFICATION[0]["@type"]).toBe("OpeningHoursSpecification")
    expect(OPENING_HOURS_SPECIFICATION[1].dayOfWeek).toBe("Saturday")
  })
})
