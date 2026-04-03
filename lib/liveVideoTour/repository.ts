import type { LiveVideoTourBooking, LiveVideoTourStatus } from "@/types/liveVideoTour"

// Repository layer for live video tour bookings
// In production: Replace with actual database operations (Supabase/Neon)

// In-memory store for development
const bookings: Map<string, LiveVideoTourBooking> = new Map()

export const liveVideoTourRepository = {
  // Create a new booking
  async create(booking: LiveVideoTourBooking): Promise<LiveVideoTourBooking> {
    bookings.set(booking.id, booking)
    
    // In production:
    // const { data, error } = await supabase
    //   .from('live_video_tour_bookings')
    //   .insert(booking)
    //   .select()
    //   .single()
    
    return booking
  },

  // Find booking by ID
  async findById(id: string): Promise<LiveVideoTourBooking | null> {
    return bookings.get(id) || null
    
    // In production:
    // const { data } = await supabase
    //   .from('live_video_tour_bookings')
    //   .select()
    //   .eq('id', id)
    //   .single()
    // return data
  },

  // Find booking by time (for availability check)
  async findByTime(preferredTime: string): Promise<LiveVideoTourBooking | null> {
    for (const booking of bookings.values()) {
      if (booking.preferredTime === preferredTime && booking.status !== "cancelled") {
        return booking
      }
    }
    return null
  },

  // Update booking status
  async updateStatus(id: string, status: LiveVideoTourStatus): Promise<LiveVideoTourBooking | null> {
    const booking = bookings.get(id)
    if (!booking) return null
    
    booking.status = status
    booking.updatedAt = new Date().toISOString()
    bookings.set(id, booking)
    
    return booking
  },

  // Update provider data (joinUrl, etc.)
  async updateProviderData(
    id: string,
    data: { joinUrl?: string; status: LiveVideoTourStatus }
  ): Promise<LiveVideoTourBooking | null> {
    const booking = bookings.get(id)
    if (!booking) return null
    
    if (data.joinUrl) booking.joinUrl = data.joinUrl
    booking.status = data.status
    booking.updatedAt = new Date().toISOString()
    bookings.set(id, booking)
    
    return booking
  },

  // Get all bookings for a date (for admin view)
  async findByDate(date: string): Promise<LiveVideoTourBooking[]> {
    const results: LiveVideoTourBooking[] = []
    for (const booking of bookings.values()) {
      if (booking.preferredTime.startsWith(date)) {
        results.push(booking)
      }
    }
    return results
  },

  // Get upcoming bookings
  async findUpcoming(): Promise<LiveVideoTourBooking[]> {
    const now = new Date().toISOString()
    const results: LiveVideoTourBooking[] = []
    
    for (const booking of bookings.values()) {
      if (
        booking.preferredTime > now &&
        booking.status !== "cancelled" &&
        booking.status !== "completed"
      ) {
        results.push(booking)
      }
    }
    
    return results.sort((a, b) => a.preferredTime.localeCompare(b.preferredTime))
  },
}
