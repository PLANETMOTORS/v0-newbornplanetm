import type { LiveVideoTourBooking } from "@/types/liveVideoTour"
import { DEALERSHIP_TIMEZONE } from "./constants"
import { Resend } from "resend"

// Notification service for live video tour bookings
function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "toni@planetmotors.ca"
const FROM_EMAIL = process.env.FROM_EMAIL || "Planet Motors <notifications@planetmotors.ca>"

interface NotificationResult {
  email: { sent: boolean; error?: string }
  sms: { sent: boolean; error?: string }
  staff: { notified: boolean; error?: string }
}

function formatBookingDateTime(booking: LiveVideoTourBooking) {
  const scheduledDate = new Date(booking.preferredTime)
  return {
    formattedDate: scheduledDate.toLocaleDateString("en-CA", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: DEALERSHIP_TIMEZONE,
    }),
    formattedTime: scheduledDate.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: DEALERSHIP_TIMEZONE,
    }),
  }
}

// Provider display names
function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case "google_meet": return "Google Meet"
    case "zoom": return "Zoom"
    case "whatsapp": return "WhatsApp Video"
    default: return "Video Call"
  }
}

// Provider-specific instructions
function getProviderInstructions(provider: string): string {
  switch (provider) {
    case "google_meet":
      return "A member of our team will walk you around the vehicle via Google Meet."
    case "zoom":
      return "A member of our team will walk you around the vehicle via Zoom."
    case "whatsapp":
      return "A member of our team will video call you on WhatsApp at the scheduled time. Keep your phone handy!"
    default:
      return "A member of our team will walk you around the vehicle via video call."
  }
}

// Email template for customer confirmation
function getCustomerConfirmationTemplate(booking: LiveVideoTourBooking, formattedDate: string, formattedTime: string) {
  const providerName = getProviderDisplayName(booking.provider)
  const providerInstructions = getProviderInstructions(booking.provider)
  const isWhatsApp = booking.provider === "whatsapp"

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Planet Motors</h1>
        <p style="margin: 5px 0 0;">Live Video Tour Confirmed</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #7c3aed;">Hi ${booking.customerName}!</h2>
        <p>Your live video tour has been scheduled. ${providerInstructions}</p>
        
        <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;"><strong>Vehicle:</strong></td>
              <td style="padding: 8px 0;">${booking.vehicleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${formattedTime} EST</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Booking ID:</strong></td>
              <td style="padding: 8px 0; font-family: monospace;">${booking.id}</td>
            </tr>
          </table>
        </div>

        ${booking.joinUrl && !isWhatsApp ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${booking.joinUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Join ${providerName}</a>
          <p style="margin-top: 10px; font-size: 12px; color: #64748b;">Or copy this link: ${booking.joinUrl}</p>
        </div>
        ` : ''}

        ${isWhatsApp ? `
        <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; color: #166534;"><strong>We will call you on WhatsApp at the scheduled time.</strong></p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #15803d;">Make sure WhatsApp is installed and your phone is nearby.</p>
        </div>
        ` : ''}

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Reminder:</strong> Join from a quiet place with good internet. Have your questions ready!</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Questions? Call us at <a href="tel:416-985-2277" style="color: #7c3aed;">416-985-2277</a>
        </p>
      </div>
      <div style="padding: 15px; background: #1e293b; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">Planet Motors | Toronto, ON</p>
      </div>
    </div>
  `
}

// Email template for staff notification
function getStaffNotificationTemplate(booking: LiveVideoTourBooking, formattedDate: string, formattedTime: string) {
  const providerName = getProviderDisplayName(booking.provider)
  const isWhatsApp = booking.provider === "whatsapp"
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${isWhatsApp ? '#22c55e' : '#7c3aed'}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Video Tour Booking</h1>
        <p style="margin: 5px 0 0; opacity: 0.9;">via ${providerName}</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        ${isWhatsApp ? `
        <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: center;">
          <strong style="color: #166534;">WhatsApp Call Required!</strong>
          <p style="margin: 4px 0 0; font-size: 14px; color: #15803d;">You must call the customer on WhatsApp at the scheduled time.</p>
        </div>
        ` : ''}
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${booking.customerName}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${booking.customerPhone}">${booking.customerPhone}</a></td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Video Method:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>${providerName}</strong></td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${booking.vehicleName}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Time:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formattedTime} EST</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Booking ID:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${booking.id}</td></tr>
          ${booking.notes ? `<tr><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Notes:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${booking.notes}</td></tr>` : ''}
        </table>
        
        ${booking.joinUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${booking.joinUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Meeting</a>
        </div>
        ` : ''}
      </div>
    </div>
  `
}

export async function sendLiveVideoTourNotifications(
  booking: LiveVideoTourBooking
): Promise<NotificationResult> {
  const results: NotificationResult = {
    email: { sent: false },
    sms: { sent: false },
    staff: { notified: false },
  }

  const { formattedDate, formattedTime } = formatBookingDateTime(booking)

  // 1. Send email confirmation to customer
  try {
    const resendClient = getResendClient()
    if (resendClient) {
      const { error } = await resendClient.emails.send({
        from: FROM_EMAIL,
        to: booking.customerEmail,
        subject: `Video Tour Confirmed - ${booking.vehicleName}`,
        html: getCustomerConfirmationTemplate(booking, formattedDate, formattedTime),
      })

      if (error) {
        console.error("[liveVideoTour] Customer email failed:", error)
        results.email.error = error.message
      } else {
        results.email.sent = true
        console.info("[liveVideoTour] Customer email sent to:", booking.customerEmail)
      }
    } else {
      console.warn("[liveVideoTour] Resend API key not configured")
      results.email.error = "Email not configured"
    }
  } catch (error) {
    console.error("[liveVideoTour] Email failed:", error)
    results.email.error = "Failed to send confirmation email"
  }

  // 2. SMS reminder - placeholder for Twilio integration
  // For now, log only. In production: integrate with Twilio
  console.info("[liveVideoTour] SMS would be sent to:", booking.customerPhone)
  results.sms.sent = false
  results.sms.error = "SMS not configured"

  // 3. Notify dealership staff via email
  try {
    const resendClient = getResendClient()
    if (resendClient) {
      const { error } = await resendClient.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Video Tour Booking - ${booking.customerName} - ${booking.vehicleName}`,
        html: getStaffNotificationTemplate(booking, formattedDate, formattedTime),
      })

      if (error) {
        console.error("[liveVideoTour] Staff email failed:", error)
        results.staff.error = error.message
      } else {
        results.staff.notified = true
        console.info("[liveVideoTour] Staff notification sent to:", ADMIN_EMAIL)
      }
    }
  } catch (error) {
    console.error("[liveVideoTour] Staff notification failed:", error)
    results.staff.error = "Failed to notify staff"
  }

  return results
}

// Send reminder before the tour (called by cron job - 1 hour before)
export async function sendTourReminder(booking: LiveVideoTourBooking): Promise<boolean> {
  const { formattedDate, formattedTime } = formatBookingDateTime(booking)

  try {
    const resendClient = getResendClient()
    if (!resendClient) {
      console.warn("[liveVideoTour] Resend not configured for reminder")
      return false
    }

    const { error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `Reminder: Video Tour in 1 Hour - ${booking.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Video Tour Reminder</h1>
            <p style="margin: 5px 0 0;">Starting in 1 hour!</p>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <h2>Hi ${booking.customerName}!</h2>
            <p>Your live video tour for <strong>${booking.vehicleName}</strong> starts soon.</p>
            
            <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 18px;"><strong>${formattedDate}</strong></p>
              <p style="margin: 5px 0; font-size: 24px; color: #f59e0b;"><strong>${formattedTime} EST</strong></p>
            </div>

            ${booking.joinUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${booking.joinUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Join Video Tour Now</a>
            </div>
            ` : ''}

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              Can't make it? Call us at <a href="tel:416-985-2277">416-985-2277</a> to reschedule.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("[liveVideoTour] Reminder email failed:", error)
      return false
    }

    console.info("[liveVideoTour] Reminder sent to:", booking.customerEmail)
    return true
  } catch (error) {
    console.error("[liveVideoTour] Reminder failed:", error)
    return false
  }
}

// Send cancellation notification
export async function sendCancellationNotification(booking: LiveVideoTourBooking): Promise<boolean> {
  const { formattedDate, formattedTime } = formatBookingDateTime(booking)

  try {
    const resendClient = getResendClient()
    if (!resendClient) {
      return false
    }

    // Email to customer
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: booking.customerEmail,
      subject: `Video Tour Cancelled - ${booking.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Video Tour Cancelled</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <p>Hi ${booking.customerName},</p>
            <p>Your video tour for <strong>${booking.vehicleName}</strong> scheduled for ${formattedDate} at ${formattedTime} has been cancelled.</p>
            <p>If you'd like to reschedule, please visit our website or call us at <a href="tel:416-985-2277">416-985-2277</a>.</p>
          </div>
        </div>
      `,
    })

    // Notify staff
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Video Tour Cancelled - ${booking.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Booking Cancelled</h1>
          </div>
          <div style="padding: 20px;">
            <table style="width: 100%;">
              <tr><td><strong>Customer:</strong></td><td>${booking.customerName}</td></tr>
              <tr><td><strong>Vehicle:</strong></td><td>${booking.vehicleName}</td></tr>
              <tr><td><strong>Was Scheduled:</strong></td><td>${formattedDate} at ${formattedTime}</td></tr>
            </table>
          </div>
        </div>
      `,
    })

    console.info("[liveVideoTour] Cancellation notifications sent")
    return true
  } catch (error) {
    console.error("[liveVideoTour] Cancellation notification failed:", error)
    return false
  }
}
