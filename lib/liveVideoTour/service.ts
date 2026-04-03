import type {
  LiveVideoTourRequestInput,
  LiveVideoTourBooking,
  LiveVideoTourResponse,
} from "@/types/liveVideoTour"
import { liveVideoTourRequestSchema } from "./schema"
import { checkSlotAvailability, isWithinBusinessHours } from "./availability"
import { createMeetingForBooking } from "./providers"
import { DEALERSHIP_TIMEZONE, DEFAULT_PROVIDER } from "./constants"
import { liveVideoTourRepository } from "./repository"
import { sendLiveVideoTourNotifications, sendCancellationNotification } from "./notifications"

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
    provider: (data.provider || DEFAULT_PROVIDER) as LiveVideoTourBooking["provider"],
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
  try {
    const savedBooking = await liveVideoTourRepository.create(booking)
    if (savedBooking) {
      booking.id = savedBooking.id // Use database-generated ID if available
    }
    console.log("[liveVideoTour] Booking saved to database:", booking.id)
  } catch (dbError) {
    console.error("[liveVideoTour] Database save failed:", dbError)
    // Continue anyway - booking can still work without DB persistence
  }

  // 8. Send notifications (email to customer + staff)
  try {
    const notificationResult = await sendLiveVideoTourNotifications(booking)
    console.log("[liveVideoTour] Notifications sent:", notificationResult)
  } catch (notifyError) {
    console.error("[liveVideoTour] Notification failed:", notifyError)
    // Continue anyway - booking is still valid
  }

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
    provider: booking.provider,
  }
}

// Cancel a booking
export async function cancelLiveVideoTourBooking(bookingId: string): Promise<LiveVideoTourResponse> {
  try {
    // 1. Find booking in database
    const booking = await liveVideoTourRepository.findById(bookingId)
    if (!booking) {
      return { ok: false, error: "Booking not found" }
    }

    if (booking.status === "cancelled") {
      return { ok: false, error: "Booking is already cancelled" }
    }

    // 2. Update status to cancelled
    const updated = await liveVideoTourRepository.updateStatus(bookingId, "cancelled")
    if (!updated) {
      return { ok: false, error: "Failed to cancel booking" }
    }

    // 3. Send cancellation notifications
    await sendCancellationNotification(booking)

    console.log("[liveVideoTour] Booking cancelled:", bookingId)
    return { ok: true, status: "cancelled" }
  } catch (error) {
    console.error("[liveVideoTour] Cancel failed:", error)
    return { ok: false, error: "Failed to cancel booking" }
  }
}

// Confirm a booking (for manual approval flow)
export async function confirmLiveVideoTourBooking(bookingId: string): Promise<LiveVideoTourResponse> {
  try {
    // 1. Find booking in database
    const booking = await liveVideoTourRepository.findById(bookingId)
    if (!booking) {
      return { ok: false, error: "Booking not found" }
    }

    if (booking.status === "confirmed") {
      return { ok: true, status: "confirmed" } // Already confirmed
    }

    // 2. Update status to confirmed
    const updated = await liveVideoTourRepository.updateStatus(bookingId, "confirmed")
    if (!updated) {
      return { ok: false, error: "Failed to confirm booking" }
    }

    // 3. Send confirmation notification (if not already sent)
    await sendLiveVideoTourNotifications(booking)

    console.log("[liveVideoTour] Booking confirmed:", bookingId)
    return { ok: true, status: "confirmed" }
  } catch (error) {
    console.error("[liveVideoTour] Confirm failed:", error)
    return { ok: false, error: "Failed to confirm booking" }
  }
}
