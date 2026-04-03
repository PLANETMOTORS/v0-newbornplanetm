import { createClient } from "@/lib/supabase/server"
import type { LiveVideoTourBooking, LiveVideoTourStatus } from "@/types/liveVideoTour"

// Database row type (snake_case from Postgres)
interface BookingRow {
  id: string
  vehicle_id: string
  vehicle_name: string
  customer_name: string
  customer_email: string
  customer_phone: string
  preferred_time: string
  timezone: string
  provider: string
  join_url: string | null
  status: string
  assigned_rep_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Map database row to domain model (snake_case → camelCase)
function toBooking(row: BookingRow): LiveVideoTourBooking {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    preferredTime: row.preferred_time,
    timezone: row.timezone,
    provider: row.provider as LiveVideoTourBooking["provider"],
    joinUrl: row.join_url || undefined,
    status: row.status as LiveVideoTourStatus,
    assignedRepId: row.assigned_rep_id || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Map domain model to database row (camelCase → snake_case)
function toRow(booking: LiveVideoTourBooking): Omit<BookingRow, "created_at" | "updated_at"> {
  return {
    id: booking.id,
    vehicle_id: booking.vehicleId,
    vehicle_name: booking.vehicleName,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    preferred_time: booking.preferredTime,
    timezone: booking.timezone || "America/Toronto",
    provider: booking.provider,
    join_url: booking.joinUrl || null,
    status: booking.status,
    assigned_rep_id: booking.assignedRepId || null,
    notes: booking.notes || null,
  }
}

export const liveVideoTourRepository = {
  // Create a new booking
  async create(booking: LiveVideoTourBooking): Promise<LiveVideoTourBooking> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .insert(toRow(booking))
      .select()
      .single()
    
    if (error) {
      console.error("[liveVideoTour] Failed to create booking:", error)
      throw new Error(`Failed to create booking: ${error.message}`)
    }
    
    // Log event
    await supabase.from("live_video_tour_events").insert({
      booking_id: data.id,
      event_type: "created",
      payload: { status: booking.status },
    })
    
    return toBooking(data)
  },

  // Find booking by ID
  async findById(id: string): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .select()
      .eq("id", id)
      .single()
    
    if (error || !data) return null
    return toBooking(data)
  },

  // Find booking by time (for availability check)
  async findByTime(preferredTime: string): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const { data } = await supabase
      .from("live_video_tour_bookings")
      .select()
      .eq("preferred_time", preferredTime)
      .neq("status", "cancelled")
      .limit(1)
      .single()
    
    if (!data) return null
    return toBooking(data)
  },

  // Update booking status
  async updateStatus(id: string, status: LiveVideoTourStatus): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single()
    
    if (error || !data) return null
    
    // Log event
    await supabase.from("live_video_tour_events").insert({
      booking_id: id,
      event_type: "status_changed",
      payload: { status },
    })
    
    return toBooking(data)
  },

  // Update provider data (joinUrl, etc.)
  async updateProviderData(
    id: string,
    providerData: { joinUrl?: string; status: LiveVideoTourStatus }
  ): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = { status: providerData.status }
    if (providerData.joinUrl) updateData.join_url = providerData.joinUrl
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (error || !data) return null
    
    // Log event
    await supabase.from("live_video_tour_events").insert({
      booking_id: id,
      event_type: "provider_data_updated",
      payload: providerData,
    })
    
    return toBooking(data)
  },

  // Get all bookings for a date (for admin view)
  async findByDate(date: string): Promise<LiveVideoTourBooking[]> {
    const supabase = await createClient()
    
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .select()
      .gte("preferred_time", startOfDay)
      .lte("preferred_time", endOfDay)
      .order("preferred_time", { ascending: true })
    
    if (error || !data) return []
    return data.map(toBooking)
  },

  // Get upcoming bookings
  async findUpcoming(): Promise<LiveVideoTourBooking[]> {
    const supabase = await createClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .select()
      .gt("preferred_time", now)
      .not("status", "in", '("cancelled","completed")')
      .order("preferred_time", { ascending: true })
    
    if (error || !data) return []
    return data.map(toBooking)
  },

  // Cancel a booking
  async cancel(id: string, reason?: string): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single()
    
    if (error || !data) return null
    
    // Log event
    await supabase.from("live_video_tour_events").insert({
      booking_id: id,
      event_type: "cancelled",
      payload: { reason },
    })
    
    return toBooking(data)
  },

  // Confirm a booking (staff action)
  async confirm(id: string): Promise<LiveVideoTourBooking | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("live_video_tour_bookings")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select()
      .single()
    
    if (error || !data) return null
    
    // Log event
    await supabase.from("live_video_tour_events").insert({
      booking_id: id,
      event_type: "confirmed",
      payload: {},
    })
    
    return toBooking(data)
  },
}
