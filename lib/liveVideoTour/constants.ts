// Live Video Tour - Business Configuration

export const DEALERSHIP_TIMEZONE = "America/Toronto"

// Business hours configuration
// 0 = Sunday, 1 = Monday, etc.
export const BUSINESS_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null, // Sunday - Closed
  1: { open: 9, close: 19 }, // Monday 9am-7pm
  2: { open: 9, close: 19 }, // Tuesday
  3: { open: 9, close: 19 }, // Wednesday
  4: { open: 9, close: 19 }, // Thursday
  5: { open: 9, close: 19 }, // Friday
  6: { open: 10, close: 17 }, // Saturday 10am-5pm
}

// Time slot configuration
export const SLOT_DURATION_MINUTES = 30
export const BOOKING_BUFFER_MINUTES = 60 // Minimum time before a slot can be booked
export const MAX_ADVANCE_DAYS = 14 // How far in advance can book

// Display strings
export const BUSINESS_HOURS_DISPLAY = "Mon-Fri 9am-7pm, Sat 10am-5pm (EST)"
export const CLOSED_DAYS_DISPLAY = "Closed Sundays"

// Default provider (can be overridden via env)
export const DEFAULT_PROVIDER = "google_meet"
