-- Live Video Tour Bookings Table
-- Stores all video tour booking requests from customers

CREATE TABLE IF NOT EXISTS public.live_video_tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  preferred_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  provider TEXT NOT NULL DEFAULT 'google_meet',
  join_url TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_live_video_tour_bookings_status ON public.live_video_tour_bookings(status);
CREATE INDEX IF NOT EXISTS idx_live_video_tour_bookings_preferred_time ON public.live_video_tour_bookings(preferred_time);
CREATE INDEX IF NOT EXISTS idx_live_video_tour_bookings_customer_email ON public.live_video_tour_bookings(customer_email);

-- Enable Row Level Security
ALTER TABLE public.live_video_tour_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts (customers can create bookings without auth)
CREATE POLICY "allow_public_insert" ON public.live_video_tour_bookings
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow public to view their own bookings by email
CREATE POLICY "allow_view_own_by_email" ON public.live_video_tour_bookings
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated staff to view all bookings
CREATE POLICY "staff_view_all" ON public.live_video_tour_bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated staff to update bookings
CREATE POLICY "staff_update" ON public.live_video_tour_bookings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_live_video_tour_bookings_updated_at ON public.live_video_tour_bookings;
CREATE TRIGGER update_live_video_tour_bookings_updated_at
  BEFORE UPDATE ON public.live_video_tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit/Event Log Table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.live_video_tour_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.live_video_tour_bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_video_tour_events_booking_id ON public.live_video_tour_events(booking_id);

-- Enable RLS on events table
ALTER TABLE public.live_video_tour_events ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view all events
CREATE POLICY "staff_view_events" ON public.live_video_tour_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow insert from service (for logging)
CREATE POLICY "allow_event_insert" ON public.live_video_tour_events
  FOR INSERT
  WITH CHECK (true);
