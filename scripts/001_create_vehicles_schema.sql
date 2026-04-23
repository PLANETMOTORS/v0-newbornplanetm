-- Planet Motors Vehicle Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  
  -- Basic Info
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  
  -- Pricing
  price INTEGER NOT NULL, -- in cents
  msrp INTEGER,
  savings INTEGER GENERATED ALWAYS AS (msrp - price) STORED,
  
  -- Specs
  mileage INTEGER NOT NULL,
  drivetrain VARCHAR(20),
  transmission VARCHAR(50),
  engine VARCHAR(100),
  fuel_type VARCHAR(30),
  fuel_economy_city INTEGER,
  fuel_economy_highway INTEGER,
  
  -- EV Specific
  is_ev BOOLEAN DEFAULT FALSE,
  battery_capacity_kwh DECIMAL(5,1),
  range_miles INTEGER,
  ev_battery_health_percent INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'pending')),
  is_certified BOOLEAN DEFAULT TRUE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  
  -- Inspection
  inspection_score INTEGER,
  inspection_date TIMESTAMP WITH TIME ZONE,
  
  -- Media
  primary_image_url TEXT,
  image_urls TEXT[], -- Array of image URLs
  has_360_spin BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  
  -- Location
  location VARCHAR(100) DEFAULT 'Richmond Hill, ON',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search optimization
  -- Includes VIN, stock_number, year, and body_style aliases (SUV, Sedan) for customer-friendly search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(make, '') || ' ' || 
      coalesce(model, '') || ' ' || 
      coalesce(trim, '') || ' ' || 
      coalesce(body_style, '') || ' ' ||
      coalesce(exterior_color, '') || ' ' ||
      coalesce(vin, '') || ' ' ||
      coalesce(stock_number, '') || ' ' ||
      coalesce(year::text, '') || ' ' ||
      CASE WHEN body_style ILIKE '%Sport Utility%' THEN 'SUV' ELSE '' END || ' ' ||
      CASE WHEN body_style ILIKE '%4dr Car%' THEN 'Sedan' ELSE '' END
    )
  ) STORED
);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON public.vehicles USING GIN(search_vector);

-- Create indexes for common filters
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON public.vehicles(make);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON public.vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON public.vehicles(mileage);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_ev ON public.vehicles(is_ev);
CREATE INDEX IF NOT EXISTS idx_vehicles_featured ON public.vehicles(featured);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer Info (for non-authenticated reservations)
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  
  -- Payment
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  deposit_amount INTEGER NOT NULL DEFAULT 25000, -- $250.00 in cents
  deposit_status VARCHAR(20) DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'refunded', 'failed')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'completed')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON public.reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON public.reservations(expires_at);

-- Finance Applications table
CREATE TABLE IF NOT EXISTS public.finance_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal Info
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  
  -- Address
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_province VARCHAR(50),
  address_postal_code VARCHAR(10),
  
  -- Employment
  employment_status VARCHAR(50),
  employer_name VARCHAR(100),
  job_title VARCHAR(100),
  monthly_income INTEGER, -- in cents
  years_employed INTEGER,
  
  -- Financing
  down_payment INTEGER, -- in cents
  trade_in_value INTEGER, -- in cents
  preferred_term_months INTEGER DEFAULT 60,
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'declined', 'cancelled')),
  credit_score_range VARCHAR(20),
  approved_rate DECIMAL(5,2),
  approved_amount INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_finance_applications_vehicle ON public.finance_applications(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_finance_applications_user ON public.finance_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_applications_status ON public.finance_applications(status);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  
  -- Preferences
  saved_vehicles UUID[], -- Array of saved vehicle IDs
  search_alerts JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vehicles: Public read access
CREATE POLICY "Vehicles are viewable by everyone" ON public.vehicles
  FOR SELECT USING (true);

-- Reservations: Users can view their own
CREATE POLICY "Users can view their own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id OR customer_email = auth.jwt()->>'email');

CREATE POLICY "Anyone can create a reservation" ON public.reservations
  FOR INSERT WITH CHECK (true);

-- Finance Applications: Users can manage their own
CREATE POLICY "Users can view their own finance applications" ON public.finance_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create finance applications" ON public.finance_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Profiles: Users can manage their own
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_applications_updated_at BEFORE UPDATE ON public.finance_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
