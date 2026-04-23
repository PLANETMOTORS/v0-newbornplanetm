import type { LiveVideoTourBooking, LiveVideoTourProviderResult } from "@/types/liveVideoTour"
import { googleMeetProvider } from "./googleMeet"
import { zoomProvider } from "./zoom"
import { whatsappProvider } from "./whatsapp"
import { DEFAULT_PROVIDER } from "../constants"

// Provider adapter interface
export interface LiveVideoTourProviderAdapter {
  createMeeting(booking: LiveVideoTourBooking): Promise<LiveVideoTourProviderResult>
  cancelMeeting?(meetingId: string): Promise<boolean>
}

// Provider selector - uses customer's choice from booking
export async function createMeetingForBooking(
  booking: LiveVideoTourBooking
): Promise<LiveVideoTourProviderResult> {
  // Use customer's preferred provider, or fallback to env/default
  const provider = booking.provider || process.env.LIVE_VIDEO_TOUR_PROVIDER || DEFAULT_PROVIDER

  switch (provider) {
    case "google_meet":
      return googleMeetProvider.createMeeting(booking)
    case "zoom":
      return zoomProvider.createMeeting(booking)
    case "whatsapp":
      return whatsappProvider.createMeeting(booking)
    default:
      console.error(`[liveVideoTour] Unsupported provider: ${provider}`)
      return {
        provider: "google_meet",
        status: "failed",
        error: "Unsupported video tour provider",
      }
  }
}

// Export individual providers for direct use if needed
export { googleMeetProvider } from "./googleMeet"
export { zoomProvider } from "./zoom"
export { whatsappProvider } from "./whatsapp"
