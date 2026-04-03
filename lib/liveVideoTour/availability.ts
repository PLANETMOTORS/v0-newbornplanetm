import type { LiveVideoTourSlot, LiveVideoTourAvailability } from "@/types/liveVideoTour"
import {
  BUSINESS_HOURS,
  DEALERSHIP_TIMEZONE,
  SLOT_DURATION_MINUTES,
  BOOKING_BUFFER_MINUTES,
  MAX_ADVANCE_DAYS,
} from "./constants"

// Check if dealership is currently open
export function isDealershipOpen(): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) return false

  const currentHour = now.getHours()
  return currentHour >= hours.open && currentHour < hours.close
}

// Get available dates for booking (next N business days)
export function getAvailableDates(): LiveVideoTourAvailability[] {
  const dates: LiveVideoTourAvailability[] = []
  const now = new Date()

  for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() + i)
    const dayOfWeek = date.getDay()

    // Skip closed days
    if (!BUSINESS_HOURS[dayOfWeek]) continue

    const dateStr = date.toISOString().split("T")[0]
    const dayLabel = date.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: DEALERSHIP_TIMEZONE,
    })

    const slots = getAvailableSlots(date)

    dates.push({
      date: dateStr,
      dayLabel,
      slots,
    })
  }

  return dates
}

// Get available time slots for a specific date
export function getAvailableSlots(date: Date): LiveVideoTourSlot[] {
  const slots: LiveVideoTourSlot[] = []
  const dayOfWeek = date.getDay()
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) return slots

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  for (let hour = hours.open; hour < hours.close; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      const slotDate = new Date(date)
      slotDate.setHours(hour, minute, 0, 0)

      // Check if slot is available (not in past, respects buffer)
      let available = true
      if (isToday) {
        const minTime = new Date(now.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000)
        available = slotDate > minTime
      }

      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
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

// Validate if a specific datetime is within business hours
export function isWithinBusinessHours(dateTime: Date): { valid: boolean; error?: string } {
  const dayOfWeek = dateTime.getDay()
  const hours = BUSINESS_HOURS[dayOfWeek]

  if (!hours) {
    return { valid: false, error: "We are closed on Sundays. Please select another day." }
  }

  const hour = dateTime.getHours()
  if (hour < hours.open || hour >= hours.close) {
    const dayName = dateTime.toLocaleDateString("en-CA", { weekday: "long" })
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
