import type {
  LiveVideoTourRequestInput,
  LiveVideoTourBooking,
  LiveVideoTourResponse,
} from "@/types/liveVideoTour"
import { liveVideoTourRequestSchema } from "./schema"
import { checkSlotAvailability, isWithinBusinessHours } from "./availability"
import { createMeetingForBooking } from "./providers"
import { DEALERSHIP_TIMEZONE, DEFAULT_PROVIDER } from "./constants"
// import { liveVideoTourRepository } from "./repository"
// import { sendLiveVideoTourNotifications } from "./notifications"

// Generate unique booking ID
function generateBookingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `VT-${timestamp}-${random}`
}

// Main service function - creates a live video tour booking
export async function createLiveVideoTourBooking(
  input: LiveVideoTourRequestInput
): Promise<LiveVideoTourResponse> {
  // 1. Validate input with zod schema
  const parsed = liveVideoTourRequestSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return { ok: false, error: firstError?.message || "Invalid input" }
  }

  const data = parsed.data

  // 2. Validate business hours
  const scheduledDateTime = new Date(data.preferredTime)
  if (isNaN(scheduledDateTime.getTime())) {
    return { ok: false, error: "Invalid date/time format" }
  }

  const hoursValidation = isWithinBusinessHours(scheduledDateTime)
  if (!hoursValidation.valid) {
    return { ok: false, error: hoursValidation.error }
  }

  // 3. Check slot availability (prevents double booking)
  const slotAvailable = await checkSlotAvailability(data.preferredTime)
  if (!slotAvailable) {
    return { ok: false, error: "Selected time is no longer available. Please choose another slot." }
  }

  // 4. Create booking record
  const bookingId = generateBookingId()
  const booking: LiveVideoTourBooking = {
    id: bookingId,
    vehicleId: data.vehicleId,
    vehicleName: data.vehicleName,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    preferredTime: scheduledDateTime.toISOString(),
    timezone: data.timezone || DEALERSHIP_TIMEZONE,
    provider: DEFAULT_PROVIDER as LiveVideoTourBooking["provider"],
    status: "requested",
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 5. Create meeting with provider (Google Meet, Zoom, WhatsApp)
  const providerResult = await createMeetingForBooking(booking)

  // 6. Update booking with provider result
  booking.provider = providerResult.provider
  booking.joinUrl = providerResult.joinUrl
  booking.status = providerResult.status
  booking.updatedAt = new Date().toISOString()

  // 7. Save to database
  // In production: await liveVideoTourRepository.create(booking)
  console.log("[liveVideoTour] Booking created:", {
    id: booking.id,
    vehicle: booking.vehicleName,
    customer: booking.customerName,
    email: booking.customerEmail,
    scheduled: booking.preferredTime,
    provider: booking.provider,
    joinUrl: booking.joinUrl,
    status: booking.status,
  })

  // 8. Send notifications
  // In production: await sendLiveVideoTourNotifications(booking)

  // 9. Return success response
  if (providerResult.status === "failed") {
    return {
      ok: false,
      error: providerResult.error || "Failed to create video tour booking",
    }
  }

  return {
    ok: true,
    bookingId: booking.id,
    joinUrl: booking.joinUrl,
    scheduledTime: booking.preferredTime,
    status: booking.status,
  }
}

// Cancel a booking
export async function cancelLiveVideoTourBooking(bookingId: string): Promise<LiveVideoTourResponse> {
  // In production:
  // 1. Find booking in database
  // 2. Cancel meeting with provider
  // 3. Update status to cancelled
  // 4. Send cancellation notifications

  console.log("[liveVideoTour] Cancelling booking:", bookingId)
  return { ok: true }
}

// Confirm a booking (for manual approval flow)
export async function confirmLiveVideoTourBooking(bookingId: string): Promise<LiveVideoTourResponse> {
  // In production:
  // 1. Find booking in database
  // 2. Update status to confirmed
  // 3. Send confirmation notifications

  console.log("[liveVideoTour] Confirming booking:", bookingId)
  return { ok: true }
}
