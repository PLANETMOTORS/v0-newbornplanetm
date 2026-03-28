-- Planet Motors Extended Schema
-- Additional tables for feature parity with Clutch.ca

-- Price Alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  -- Alert criteria
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  make VARCHAR(50),
  model VARCHAR(100),
  max_price INTEGER,
  min_year INTEGER,
  max_mileage INTEGER,
  fuel_type VARCHAR(30),
  
  -- Preferences
  notify_price_drops BOOLEAN DEFAULT TRUE,
  notify_new_listings BOOLEAN DEFAULT TRUE,
  notify_back_in_stock BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON public.price_alerts(email);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(is_active);

-- Saved Searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(100),
  
  -- Search criteria (stored as JSON for flexibility)
  criteria JSONB NOT NULL,
  
  -- Notification settings
  notify_frequency VARCHAR(20) DEFAULT 'daily' CHECK (notify_frequency IN ('instant', 'daily', 'weekly', 'never')),
  last_notified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches(user_id);

-- Delivery Tracking table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Delivery details
  delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
  scheduled_date DATE NOT NULL,
  scheduled_time_slot VARCHAR(50),
  
  -- Address
  delivery_address_street VARCHAR(200),
  delivery_address_city VARCHAR(100),
  delivery_address_province VARCHAR(50),
  delivery_address_postal_code VARCHAR(10),
  
  -- Tracking
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'preparing', 'in_transit', 'arriving_soon', 'delivered', 'cancelled')),
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_delivery_at TIMESTAMP WITH TIME ZONE,
  
  -- Driver info
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  tracking_url TEXT,
  
  -- Cost
  delivery_fee INTEGER DEFAULT 0, -- in cents
  distance_km INTEGER,
  
  -- Notes
  special_instructions TEXT,
  delivery_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_reservation ON public.deliveries(reservation_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON public.deliveries(scheduled_date);

-- Customer Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  
  -- Review details
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  
  -- Review type
  review_type VARCHAR(30) DEFAULT 'purchase' CHECK (review_type IN ('purchase', 'test_drive', 'service', 'general')),
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer info (for display)
  customer_name VARCHAR(100),
  customer_city VARCHAR(100),
  purchase_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON public.reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(is_featured);

-- Service Bookings table
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  
  -- Customer vehicle (if not from our inventory)
  customer_vehicle_year INTEGER,
  customer_vehicle_make VARCHAR(50),
  customer_vehicle_model VARCHAR(100),
  customer_vehicle_vin VARCHAR(17),
  
  -- Booking details
  service_type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  
  -- Contact
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Notes
  service_notes TEXT,
  customer_notes TEXT,
  
  -- Cost estimate
  estimated_cost INTEGER, -- in cents
  actual_cost INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_user ON public.service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON public.service_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);

-- Vehicle Views/Analytics table
CREATE TABLE IF NOT EXISTS public.vehicle_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  
  -- View details
  view_type VARCHAR(20) DEFAULT 'listing' CHECK (view_type IN ('listing', 'detail', '360_spin', 'gallery')),
  source VARCHAR(50), -- 'search', 'home', 'similar', 'ad'
  referrer TEXT,
  
  -- Device info
  device_type VARCHAR(20),
  browser VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_views_vehicle ON public.vehicle_views(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_views_date ON public.vehicle_views(created_at);

-- Trade-In Appraisals table
CREATE TABLE IF NOT EXISTS public.trade_in_appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Vehicle being traded
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  vin VARCHAR(17),
  license_plate VARCHAR(10),
  province VARCHAR(10),
  mileage INTEGER NOT NULL,
  
  -- Condition
  exterior_condition VARCHAR(20),
  interior_condition VARCHAR(20),
  mechanical_condition VARCHAR(20),
  has_accidents BOOLEAN DEFAULT FALSE,
  accident_details TEXT,
  modifications TEXT,
  
  -- Estimate (using Canadian Black Book)
  cbb_trade_in_low INTEGER, -- in cents
  cbb_trade_in_avg INTEGER,
  cbb_trade_in_high INTEGER,
  our_offer INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'offer_sent', 'accepted', 'declined', 'expired')),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Contact
  customer_name VARCHAR(100),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Photos
  photo_urls TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_in_appraisals_user ON public.trade_in_appraisals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_appraisals_status ON public.trade_in_appraisals(status);

-- Enable RLS on new tables
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_in_appraisals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own deliveries" ON public.deliveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Approved reviews are public" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own service bookings" ON public.service_bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create vehicle views" ON public.vehicle_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own trade-in appraisals" ON public.trade_in_appraisals
  FOR ALL USING (auth.uid() = user_id OR customer_email = auth.jwt()->>'email');

-- Update triggers
CREATE TRIGGER update_price_alerts_updated_at BEFORE UPDATE ON public.price_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_in_appraisals_updated_at BEFORE UPDATE ON public.trade_in_appraisals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
