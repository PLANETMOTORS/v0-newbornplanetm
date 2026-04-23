// Live Video Tour - Feature Exports
// Domain: liveVideoTour

// Service functions
export { 
  createLiveVideoTourBooking,
  cancelLiveVideoTourBooking,
  confirmLiveVideoTourBooking 
} from "./service"

// Availability functions
export { 
  isDealershipOpen,
  getAvailableDates,
  getAvailableSlots,
  isWithinBusinessHours,
  checkSlotAvailability 
} from "./availability"

// Schema and validation
export { 
  liveVideoTourRequestSchema,
  formatPhoneNumber,
  isValidPhone 
} from "./schema"

// Constants
export { 
  BUSINESS_HOURS,
  DEALERSHIP_TIMEZONE,
  BUSINESS_HOURS_DISPLAY,
  SLOT_DURATION_MINUTES,
  BOOKING_BUFFER_MINUTES,
  MAX_ADVANCE_DAYS,
  DEFAULT_PROVIDER 
} from "./constants"

// Providers
export { createMeetingForBooking } from "./providers"

// Repository
export { liveVideoTourRepository } from "./repository"

// Notifications
export { 
  sendLiveVideoTourNotifications,
  sendTourReminder,
  sendCancellationNotification 
} from "./notifications"
