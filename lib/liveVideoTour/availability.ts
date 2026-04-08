import type { LiveVideoTourSlot, LiveVideoTourAvailability } from "@/types/liveVideoTour"
import {
  BUSINESS_HOURS,
  DEALERSHIP_TIMEZONE,
  SLOT_DURATION_MINUTES,
  BOOKING_BUFFER_MINUTES,
  MAX_ADVANCE_DAYS,
} from "./constants"

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0")
}

function parseIsoDate(dateStr: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null

  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() + 1 !== month ||
    utc.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function getDateAtUtcNoon(dateStr: string): Date | null {
  const parsed = parseIsoDate(dateStr)
  if (!parsed) return null

  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0, 0))
}

export function normalizeIsoDate(dateStr: string): string | null {
  const parsed = parseIsoDate(dateStr)
  if (!parsed) return null
  return `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`
}

function getDateStrFromUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const date = getDateAtUtcNoon(dateStr)
  if (!date) return dateStr
  date.setUTCDate(date.getUTCDate() + days)
  return getDateStrFromUtcDate(date)
}

function getZonedParts(date: Date): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: string
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEALERSHIP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date)

  const valueFor = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? ""

  return {
    year: Number(valueFor("year")),
    month: Number(valueFor("month")),
    day: Number(valueFor("day")),
    hour: Number(valueFor("hour")),
    minute: Number(valueFor("minute")),
    weekday: valueFor("weekday"),
  }
}

function getDealershipDateStr(date: Date): string {
  const zoned = getZonedParts(date)
  return `${zoned.year}-${pad2(zoned.month)}-${pad2(zoned.day)}`
}

function getDealershipDayOfWeek(dateStr: string): number {
  const date = getDateAtUtcNoon(dateStr)
  if (!date) return -1
  const weekdayShort = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEALERSHIP_TIMEZONE,
    weekday: "short",
  }).format(date)
  return WEEKDAY_TO_INDEX[weekdayShort] ?? -1
}

function formatSlotLabel(hour24: number, minute: number): string {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const period = hour24 >= 12 ? "p.m." : "a.m."
  return `${hour12}:${pad2(minute)} ${period}`
}

// Check if dealership is currently open
export function isDealershipOpen(): boolean {
  const now = new Date()
  const nowDateStr = getDealershipDateStr(now)
  const dayOfWeek = getDealershipDayOfWeek(nowDateStr)
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) return false

  const currentHour = getZonedParts(now).hour
  return currentHour >= hours.open && currentHour < hours.close
}

// Get available dates for booking (next N business days)
export function getAvailableDates(): LiveVideoTourAvailability[] {
  const dates: LiveVideoTourAvailability[] = []
  const todayStr = getDealershipDateStr(new Date())

  for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
    const dateStr = addDaysToDateStr(todayStr, i)
    const dayOfWeek = getDealershipDayOfWeek(dateStr)

    // Skip closed days
    if (!BUSINESS_HOURS[dayOfWeek]) continue

    const dayLabel = new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: DEALERSHIP_TIMEZONE,
    }).format(getDateAtUtcNoon(dateStr) ?? new Date())

    const slots = getAvailableSlots(dateStr).filter((slot) => slot.available)
    if (slots.length === 0) continue

    dates.push({
      date: dateStr,
      dayLabel,
      slots,
    })
  }

  return dates
}

// Get available time slots for a specific date
export function getAvailableSlots(dateInput: Date | string): LiveVideoTourSlot[] {
  const slots: LiveVideoTourSlot[] = []
  const dateStr =
    typeof dateInput === "string" ? dateInput : getDealershipDateStr(dateInput)
  const dayOfWeek = getDealershipDayOfWeek(dateStr)
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) return slots

  const now = new Date()
  const minTime = new Date(now.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000)
  const minTimeDateStr = getDealershipDateStr(minTime)
  const minTimeParts = getZonedParts(minTime)
  const minTimeMinutesOfDay = minTimeParts.hour * 60 + minTimeParts.minute

  for (let hour = hours.open; hour < hours.close; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      // Check if slot is available (not in past, respects buffer)
      const slotMinutesOfDay = hour * 60 + minute
      let available = dateStr > minTimeDateStr

      if (dateStr === minTimeDateStr) {
        available = slotMinutesOfDay > minTimeMinutesOfDay
      }

      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const label = formatSlotLabel(hour, minute)

      slots.push({ time: timeStr, label, available })
    }
  }

  return slots
}

// Validate if a specific datetime is within business hours
export function isWithinBusinessHours(dateTime: Date): { valid: boolean; error?: string } {
  const dateStr = getDealershipDateStr(dateTime)
  const dayOfWeek = getDealershipDayOfWeek(dateStr)
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) {
    const dayName = new Intl.DateTimeFormat("en-CA", {
      weekday: "long",
      timeZone: DEALERSHIP_TIMEZONE,
    }).format(dateTime)
    return { valid: false, error: `We are closed on ${dayName}s. Please select another day.` }
  }

  const zoned = getZonedParts(dateTime)
  const hour = zoned.hour
  if (hour < hours.open || hour >= hours.close) {
    const dayName = new Intl.DateTimeFormat("en-CA", {
      weekday: "long",
      timeZone: DEALERSHIP_TIMEZONE,
    }).format(dateTime)
    const openTime = hours.open > 12 ? `${hours.open - 12}pm` : `${hours.open}am`
    const closeTime = hours.close > 12 ? `${hours.close - 12}pm` : `${hours.close}am`
    return {
      valid: false,
      error: `We are only available ${openTime} - ${closeTime} on ${dayName}.`,
    }
  }

  // Check if the time is in the past
  const now = new Date()
  if (dateTime <= now) {
    return { valid: false, error: "Please select a future time slot." }
  }

  return { valid: true }
}

// Check if a specific slot is still available (for real-time validation)
export async function checkSlotAvailability(preferredTime: string): Promise<boolean> {
  const dateTime = new Date(preferredTime)
  const validation = isWithinBusinessHours(dateTime)
  
  if (!validation.valid) return false

  // In production: also check database for existing bookings at this time
  // const existingBooking = await repository.findByTime(preferredTime)
  // if (existingBooking) return false

  return true
}
