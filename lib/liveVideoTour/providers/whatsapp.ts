import type { LiveVideoTourBooking, LiveVideoTourProviderResult } from "@/types/liveVideoTour"
import type { LiveVideoTourProviderAdapter } from "./index"

// WhatsApp Provider
// WhatsApp video calls are initiated directly from the phone
// This provider just tracks the booking and notifies staff

// Dealership WhatsApp Business number


export const whatsappProvider: LiveVideoTourProviderAdapter = {
  async createMeeting(booking: LiveVideoTourBooking): Promise<LiveVideoTourProviderResult> {
    try {
      // WhatsApp doesn't have meeting links like Zoom/Meet
      // The staff will call the customer at the scheduled time
      
      // Generate a WhatsApp deep link for the staff to use
      const customerPhoneDigits = booking.customerPhone.replaceAll(/\D/g, "")
      const staffWhatsAppLink = `https://wa.me/${customerPhoneDigits}`

      // In production:
      // 1. Send notification to staff with customer details
      // 2. Optionally send WhatsApp message to customer confirming the call
      // 3. Add calendar reminder for staff

      return {
        provider: "whatsapp",
        joinUrl: staffWhatsAppLink, // This is for staff use, not customer
        status: "confirmed",
      }
    } catch (error) {
      console.error("[liveVideoTour] WhatsApp setup failed:", error)
      return {
        provider: "whatsapp",
        status: "failed",
        error: "Failed to set up WhatsApp video call",
      }
    }
  },
}
