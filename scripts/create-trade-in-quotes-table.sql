-- Create trade_in_quotes table to store AI instant quotes
CREATE TABLE IF NOT EXISTS trade_in_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Vehicle info
  vehicle_year INTEGER NOT NULL,
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_trim VARCHAR(200),
  mileage INTEGER,
  condition VARCHAR(50),
  postal_code VARCHAR(10),
  vin VARCHAR(17),
  
  -- Customer info (for non-authenticated users)
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Offer details
  offer_amount INTEGER NOT NULL,
  offer_low INTEGER,
  offer_high INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, applied_to_purchase, expired, cancelled
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Applied to purchase
  applied_to_vehicle_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'instant_quote' -- instant_quote, trade_in_form
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trade_in_quotes_user_id ON trade_in_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_quotes_quote_id ON trade_in_quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_quotes_status ON trade_in_quotes(status);
CREATE INDEX IF NOT EXISTS idx_trade_in_quotes_email ON trade_in_quotes(customer_email);

-- Enable RLS
ALTER TABLE trade_in_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own quotes
CREATE POLICY "Users can view own quotes" ON trade_in_quotes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own quotes
CREATE POLICY "Users can update own quotes" ON trade_in_quotes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Anyone can insert quotes (before auth)
CREATE POLICY "Anyone can insert quotes" ON trade_in_quotes
  FOR INSERT WITH CHECK (true);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON trade_in_quotes
  FOR ALL USING (auth.role() = 'service_role');
