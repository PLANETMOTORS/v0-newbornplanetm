import type { LiveVideoTourBooking } from "@/types/liveVideoTour"
import { DEALERSHIP_TIMEZONE } from "./constants"

// Notification service for live video tour bookings
// In production: Integrate with email (Resend/SendGrid) and SMS (Twilio)

interface NotificationResult {
  email: { sent: boolean; error?: string }
  sms: { sent: boolean; error?: string }
  staff: { notified: boolean; error?: string }
}

export async function sendLiveVideoTourNotifications(
  booking: LiveVideoTourBooking
): Promise<NotificationResult> {
  const results: NotificationResult = {
    email: { sent: false },
    sms: { sent: false },
    staff: { notified: false },
  }

  // Format the scheduled time for display
  const scheduledDate = new Date(booking.preferredTime)
  const formattedDate = scheduledDate.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: DEALERSHIP_TIMEZONE,
  })
  const formattedTime = scheduledDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DEALERSHIP_TIMEZONE,
  })

  // 1. Send email confirmation to customer
  try {
    // In production: Use Resend or SendGrid
    // await resend.emails.send({
    //   from: 'Planet Motors <tours@planetmotors.ca>',
    //   to: booking.customerEmail,
    //   subject: `Video Tour Confirmed - ${booking.vehicleName}`,
    //   html: `...`
    // })

    console.log("[liveVideoTour] Email notification:", {
      to: booking.customerEmail,
      subject: `Video Tour Confirmed - ${booking.vehicleName}`,
      date: formattedDate,
      time: formattedTime,
      joinUrl: booking.joinUrl,
    })

    results.email.sent = true
  } catch (error) {
    console.error("[liveVideoTour] Email failed:", error)
    results.email.error = "Failed to send confirmation email"
  }

  // 2. Send SMS reminder to customer (optional)
  try {
    // In production: Use Twilio
    // await twilio.messages.create({
    //   to: booking.customerPhone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   body: `Your video tour for ${booking.vehicleName} is confirmed for ${formattedDate} at ${formattedTime}. Join link: ${booking.joinUrl}`
    // })

    console.log("[liveVideoTour] SMS notification:", {
      to: booking.customerPhone,
      message: `Video tour confirmed for ${formattedDate} at ${formattedTime}`,
    })

    results.sms.sent = true
  } catch (error) {
    console.error("[liveVideoTour] SMS failed:", error)
    results.sms.error = "Failed to send SMS"
  }

  // 3. Notify dealership staff
  try {
    // In production: Send to staff Slack/Teams channel or email
    // await slack.chat.postMessage({
    //   channel: '#video-tours',
    //   text: `New video tour booking!`,
    //   blocks: [...]
    // })

    console.log("[liveVideoTour] Staff notification:", {
      customer: booking.customerName,
      phone: booking.customerPhone,
      vehicle: booking.vehicleName,
      date: formattedDate,
      time: formattedTime,
      notes: booking.notes,
    })

    results.staff.notified = true
  } catch (error) {
    console.error("[liveVideoTour] Staff notification failed:", error)
    results.staff.error = "Failed to notify staff"
  }

  return results
}

// Send reminder before the tour (called by cron job)
export async function sendTourReminder(booking: LiveVideoTourBooking): Promise<boolean> {
  const scheduledDate = new Date(booking.preferredTime)
  const formattedTime = scheduledDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DEALERSHIP_TIMEZONE,
  })

  console.log("[liveVideoTour] Sending reminder:", {
    to: booking.customerEmail,
    phone: booking.customerPhone,
    time: formattedTime,
    joinUrl: booking.joinUrl,
  })

  // In production: Send email + SMS reminder
  return true
}

// Send cancellation notification
export async function sendCancellationNotification(booking: LiveVideoTourBooking): Promise<boolean> {
  console.log("[liveVideoTour] Cancellation notification:", {
    to: booking.customerEmail,
    vehicle: booking.vehicleName,
  })

  // In production: Send email + notify staff
  return true
}
