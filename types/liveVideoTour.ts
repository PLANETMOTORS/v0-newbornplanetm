// Live Video Tour - Core Types
// Domain: liveVideoTour (user-facing: "Schedule Live Video Tour")

export type LiveVideoTourProvider = "google_meet" | "zoom" | "whatsapp"

export type LiveVideoTourStatus =
  | "requested"
  | "pending_link"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "failed"

export interface LiveVideoTourRequestInput {
  vehicleId: string
  vehicleName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  preferredTime: string // ISO string
  timezone?: string
  provider?: LiveVideoTourProvider // Customer's preferred method
  notes?: string
}

export interface LiveVideoTourBooking {
  id: string
  vehicleId: string
  vehicleName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  preferredTime: string
  timezone: string
  provider: LiveVideoTourProvider
  joinUrl?: string
  status: LiveVideoTourStatus
  assignedRepId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LiveVideoTourSlot {
  time: string // HH:mm format
  label: string // Display format (e.g., "10:00 AM")
  available: boolean
}

export interface LiveVideoTourAvailability {
  date: string // YYYY-MM-DD
  dayLabel: string
  slots: LiveVideoTourSlot[]
}

export interface LiveVideoTourResponse {
  ok: boolean
  bookingId?: string
  joinUrl?: string
  scheduledTime?: string
  provider?: LiveVideoTourProvider
  status?: LiveVideoTourStatus
  error?: string
}

export interface LiveVideoTourProviderResult {
  provider: LiveVideoTourProvider
  joinUrl?: string
  status: LiveVideoTourStatus
  error?: string
}

// Vehicle configuration for live video tour feature
export interface VehicleLiveVideoTourConfig {
  enabled: boolean
  videoWalkaroundUrl?: string // Prerecorded video (separate feature)
}
