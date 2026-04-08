import type { LiveVideoTourSlot, LiveVideoTourAvailability } from "@/types/liveVideoTour"
import {
  BUSINESS_HOURS,
  DEALERSHIP_TIMEZONE,
  SLOT_DURATION_MINUTES,
  BOOKING_BUFFER_MINUTES,
  MAX_ADVANCE_DAYS,
} from "./constants"

// ─── Timezone helpers ─────────────────────────────────────────────────────────

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

// Returns individual date/time components for `date` in the given IANA timezone.
function localParts(date: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  const year = parseInt(parts.year, 10)
  const month = parseInt(parts.month, 10)
  const day = parseInt(parts.day, 10)
  let hour = parseInt(parts.hour, 10)
  if (hour === 24) hour = 0 // Some engines report midnight as 24
  const minute = parseInt(parts.minute, 10)
  // Use the year string directly from Intl (4-digit), pad month/day to 2 digits
  const dateStr = `${parts.year}-${pad2(month)}-${pad2(day)}`
  // Use UTC noon to determine day-of-week (avoids cross-day DST ambiguity)
  const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getDay()
  return { dateStr, year, month, day, hour, minute, dayOfWeek }
}

// Returns the UTC Date that corresponds to the given local clock time on
// `dateStr` (YYYY-MM-DD) in the dealership timezone. Handles DST correctly.
function torontoTimeToDate(dateStr: string, hour: number, minute: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  // Start with a UTC approximation at the desired clock time
  const approx = new Date(Date.UTC(y, m - 1, d, hour, minute, 0))
  // Find what Toronto local clock time that UTC instant maps to
  const { hour: lHour, minute: lMin } = localParts(approx, DEALERSHIP_TIMEZONE)
  // Shift by the difference so the result lands on the correct local time
  const desiredMs = (hour * 60 + minute) * 60_000
  const gotMs = (lHour * 60 + lMin) * 60_000
  return new Date(approx.getTime() + (desiredMs - gotMs))
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Check if dealership is currently open (evaluated in dealership timezone)
export function isDealershipOpen(): boolean {
  const { dayOfWeek, hour } = localParts(new Date(), DEALERSHIP_TIMEZONE)
  const hours = BUSINESS_HOURS[dayOfWeek]
  if (!hours) return false
  return hour >= hours.open && hour < hours.close
}

// Get available dates for booking (next N business days, in dealership timezone)
export function getAvailableDates(): LiveVideoTourAvailability[] {
  const dates: LiveVideoTourAvailability[] = []
  const now = new Date()
  const { year: ty, month: tm, day: td } = localParts(now, DEALERSHIP_TIMEZONE)

  for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
    // Use UTC noon to represent each candidate day (avoids DST midnight edge cases)
    const candidate = new Date(Date.UTC(ty, tm - 1, td + i, 12, 0, 0))
    const { dateStr, dayOfWeek } = localParts(candidate, DEALERSHIP_TIMEZONE)

    // Skip closed days
    if (!BUSINESS_HOURS[dayOfWeek]) continue

    const dayLabel = candidate.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: DEALERSHIP_TIMEZONE,
    })

    const slots = getAvailableSlots(dateStr)

    // Skip days where no slots remain available
    if (slots.every((s) => !s.available)) continue

    dates.push({ date: dateStr, dayLabel, slots })
  }

  return dates
}

// Get available time slots for a specific date.
// Accepts a YYYY-MM-DD string (Toronto local date) or a Date object.
export function getAvailableSlots(dateOrStr: Date | string): LiveVideoTourSlot[] {
  const now = new Date()
  const nowParts = localParts(now, DEALERSHIP_TIMEZONE)

  // Resolve to a Toronto-local YYYY-MM-DD string
  const dateStr =
    typeof dateOrStr === "string"
      ? dateOrStr
      : localParts(dateOrStr, DEALERSHIP_TIMEZONE).dateStr

  const [dy, dm, dd] = dateStr.split("-").map(Number)
  // Day of week via UTC noon (avoids DST midnight edge case)
  const { dayOfWeek } = localParts(
    new Date(Date.UTC(dy, dm - 1, dd, 12, 0, 0)),
    DEALERSHIP_TIMEZONE
  )
  const hours = BUSINESS_HOURS[dayOfWeek]
  if (!hours) return []

  const isToday = dateStr === nowParts.dateStr
  const minTime = new Date(now.getTime() + BOOKING_BUFFER_MINUTES * 60_000)
  const slots: LiveVideoTourSlot[] = []

  for (let hour = hours.open; hour < hours.close; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      // Build a proper UTC Date for this Toronto local slot time
      const slotDate = torontoTimeToDate(dateStr, hour, minute)
      const available = isToday ? slotDate > minTime : true
      const timeStr = `${pad2(hour)}:${pad2(minute)}`
      const label = slotDate.toLocaleTimeString("en-CA", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: DEALERSHIP_TIMEZONE,
      })

      slots.push({ time: timeStr, label, available })
    }
  }

  return slots
}

// Validate if a specific datetime is within business hours (in dealership timezone)
export function isWithinBusinessHours(dateTime: Date): { valid: boolean; error?: string } {
  const { dayOfWeek, hour } = localParts(dateTime, DEALERSHIP_TIMEZONE)
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) {
    const closedDayName = dateTime.toLocaleDateString("en-CA", {
      weekday: "long",
      timeZone: DEALERSHIP_TIMEZONE,
    })
    return {
      valid: false,
      error: `We are closed on ${closedDayName}s. Please select another day.`,
    }
  }

  if (hour < hours.open || hour >= hours.close) {
    const dayName = dateTime.toLocaleDateString("en-CA", {
      weekday: "long",
      timeZone: DEALERSHIP_TIMEZONE,
    })
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
