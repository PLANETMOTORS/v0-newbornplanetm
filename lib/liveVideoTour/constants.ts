// Live Video Tour - Business Configuration
// Hours & timezone imported from central config — do NOT duplicate here.

export {
  DEALERSHIP_TIMEZONE,
  BUSINESS_HOURS,
  BUSINESS_HOURS_DISPLAY,
} from "@/lib/constants/dealership"

// Time slot configuration
export const SLOT_DURATION_MINUTES = 30
export const BOOKING_BUFFER_MINUTES = 60 // Minimum time before a slot can be booked
export const MAX_ADVANCE_DAYS = 14 // How far in advance can book

// Display strings
export const CLOSED_DAYS_DISPLAY = "Closed Sundays"

// Default provider (can be overridden via env)
export const DEFAULT_PROVIDER = "google_meet"
