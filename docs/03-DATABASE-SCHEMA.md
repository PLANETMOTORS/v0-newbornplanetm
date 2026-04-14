# PLANET MOTORS - DATABASE SCHEMA

## Overview

Planet Motors uses **Supabase PostgreSQL** as the primary database with **Row Level Security (RLS)** enabled on all tables.

## 1. Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  drivers_license_number VARCHAR(50),
  drivers_license_province VARCHAR(2),
  preferred_contact VARCHAR(20) DEFAULT 'email',
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to Supabase Auth
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON customers FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" 
  ON customers FOR UPDATE 
  USING (auth.uid() = auth_user_id);
```

## 2. Customer Addresses Table

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type VARCHAR(20) NOT NULL, -- 'billing', 'shipping', 'both'
  street_address VARCHAR(255) NOT NULL,
  unit_number VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(2) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(2) DEFAULT 'CA',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);

-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" 
  ON customer_addresses FOR ALL 
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

## 3. Vehicles Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sanity_id VARCHAR(50) UNIQUE, -- Reference to Sanity CMS
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  
  -- Vehicle Details
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  body_type VARCHAR(50), -- 'Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback'
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  
  -- Specifications
  mileage INTEGER NOT NULL,
  fuel_type VARCHAR(20), -- 'Gasoline', 'Diesel', 'Electric', 'Hybrid', 'PHEV'
  transmission VARCHAR(20), -- 'Automatic', 'Manual', 'CVT'
  drivetrain VARCHAR(10), -- 'FWD', 'RWD', 'AWD', '4WD'
  engine VARCHAR(100),
  doors INTEGER,
  seats INTEGER,
  
  -- EV Specific
  battery_capacity_kwh DECIMAL(5,1),
  battery_health_percent INTEGER,
  range_km INTEGER,
  charging_speed VARCHAR(50),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  msrp DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'pending'
  is_featured BOOLEAN DEFAULT false,
  is_certified BOOLEAN DEFAULT false,
  
  -- Certification
  inspection_date DATE,
  inspection_score INTEGER,
  carfax_url VARCHAR(500),
  
  -- Metadata
  hub_id UUID REFERENCES hubs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_fuel_type ON vehicles(fuel_type);
CREATE INDEX idx_vehicles_body_type ON vehicles(body_type);

-- RLS Policies (Public read, Admin write)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available vehicles" 
  ON vehicles FOR SELECT 
  USING (status IN ('available', 'reserved'));
```

## 4. Vehicle Photos Table

```sql
CREATE TABLE vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  photo_type VARCHAR(20) DEFAULT 'exterior', -- 'exterior', 'interior', 'engine', 'damage'
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_photos_vehicle ON vehicle_photos(vehicle_id);

-- RLS
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle photos" 
  ON vehicle_photos FOR SELECT 
  USING (true);
```

## 5. Inspections Table (210-Point)

```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspector_name VARCHAR(100),
  
  -- Overall
  overall_score INTEGER NOT NULL, -- 0-210
  passed BOOLEAN DEFAULT false,
  
  -- Category Scores (JSON for flexibility)
  engine_score JSONB,
  transmission_score JSONB,
  brakes_score JSONB,
  suspension_score JSONB,
  electrical_score JSONB,
  interior_score JSONB,
  exterior_score JSONB,
  safety_score JSONB,
  
  -- Notes
  notes TEXT,
  recommendations TEXT,
  
  -- Documents
  report_url VARCHAR(500),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inspections_vehicle ON inspections(vehicle_id);

-- RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inspections" 
  ON inspections FOR SELECT 
  USING (true);
```

## 6. Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  
  -- Order Type
  order_type VARCHAR(20) NOT NULL, -- 'reservation', 'purchase'
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'confirmed', 'processing', 'ready_for_delivery', 
  -- 'in_transit', 'delivered', 'completed', 'cancelled', 'refunded'
  
  -- Pricing
  vehicle_price DECIMAL(10,2) NOT NULL,
  trade_in_credit DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  protection_plan_fee DECIMAL(10,2) DEFAULT 0,
  documentation_fee DECIMAL(10,2) DEFAULT 399,
  omvic_fee DECIMAL(10,2) DEFAULT 10,
  subtotal DECIMAL(10,2) NOT NULL,
  hst DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Deposit
  deposit_amount DECIMAL(10,2) DEFAULT 250,
  deposit_status VARCHAR(20) DEFAULT 'pending',
  deposit_paid_at TIMESTAMPTZ,
  
  -- Financing
  financing_application_id UUID REFERENCES financing_applications(id),
  payment_method VARCHAR(20), -- 'finance', 'cash', 'lease'
  
  -- Trade-In
  trade_in_id UUID REFERENCES trade_ins(id),
  
  -- Delivery
  delivery_type VARCHAR(20), -- 'pickup', 'delivery'
  delivery_address_id UUID REFERENCES customer_addresses(id),
  
  -- Protection
  protection_plan_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

## 7. Financing Applications Table

```sql
CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  
  -- Status
  status VARCHAR(30) DEFAULT 'submitted',
  -- 'draft', 'submitted', 'under_review', 'approved', 'declined', 'expired'
  
  -- Loan Details
  requested_amount DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  preferred_term_months INTEGER DEFAULT 60,
  
  -- Employment
  employment_status VARCHAR(30),
  employer_name VARCHAR(100),
  job_title VARCHAR(100),
  employment_years INTEGER,
  annual_income DECIMAL(12,2),
  
  -- Housing
  housing_status VARCHAR(30), -- 'own', 'rent', 'other'
  monthly_housing_payment DECIMAL(10,2),
  years_at_address INTEGER,
  
  -- Credit
  credit_score_range VARCHAR(20),
  bankruptcy_history BOOLEAN DEFAULT false,
  
  -- Consent
  credit_check_consent BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  
  -- Documents
  proof_of_income_url VARCHAR(500),
  proof_of_address_url VARCHAR(500),
  id_document_url VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_finance_apps_customer ON financing_applications(customer_id);
CREATE INDEX idx_finance_apps_status ON financing_applications(status);

-- RLS
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own applications" 
  ON financing_applications FOR ALL 
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

## 8. Financing Offers Table

```sql
CREATE TABLE financing_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES financing_applications(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES lenders(id),
  
  -- Offer Details
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'selected', 'expired'
  
  -- Approved Terms
  approved_amount DECIMAL(10,2),
  interest_rate DECIMAL(5,2),
  term_months INTEGER,
  monthly_payment DECIMAL(10,2),
  total_interest DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- Conditions
  conditions TEXT,
  required_down_payment DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  selected_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_offers_application ON financing_offers(application_id);
CREATE INDEX idx_offers_lender ON financing_offers(lender_id);

-- RLS
ALTER TABLE financing_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offers" 
  ON financing_offers FOR SELECT 
  USING (application_id IN (
    SELECT id FROM financing_applications fa
    JOIN customers c ON fa.customer_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));
```

## 9. Lenders Table

```sql
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  
  -- API Integration
  api_endpoint VARCHAR(500),
  api_key_encrypted TEXT,
  
  -- Lending Criteria
  min_credit_score INTEGER,
  max_loan_amount DECIMAL(12,2),
  min_loan_amount DECIMAL(12,2),
  min_term_months INTEGER,
  max_term_months INTEGER,
  
  -- Rates
  base_rate DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 10. Trade-Ins Table

```sql
CREATE TABLE trade_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Vehicle Details
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  mileage INTEGER NOT NULL,
  vin VARCHAR(17),
  
  -- Condition
  condition VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
  exterior_condition VARCHAR(20),
  interior_condition VARCHAR(20),
  mechanical_issues TEXT,
  accident_history BOOLEAN DEFAULT false,
  
  -- Valuation
  estimated_value DECIMAL(10,2),
  cbb_value DECIMAL(10,2), -- Canadian Black Book value
  final_offer DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- 'pending', 'quoted', 'accepted', 'inspected', 'completed', 'declined'
  
  -- Photos
  photos JSONB, -- Array of photo URLs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  quoted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tradeins_customer ON trade_ins(customer_id);
CREATE INDEX idx_tradeins_status ON trade_ins(status);

-- RLS
ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trade-ins" 
  ON trade_ins FOR ALL 
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

## 11. Deliveries Table

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- Delivery Details
  delivery_type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery'
  
  -- Address (for delivery)
  address_id UUID REFERENCES customer_addresses(id),
  
  -- Schedule
  scheduled_date DATE,
  scheduled_time_slot VARCHAR(50),
  estimated_delivery_date DATE,
  
  -- Tracking
  status VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'scheduled', 'preparing', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
  
  tracking_number VARCHAR(100),
  carrier VARCHAR(50),
  
  -- Distance & Cost
  distance_km INTEGER,
  delivery_fee DECIMAL(10,2),
  
  -- Driver/Pickup
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  
  -- Pickup Details (for pickup)
  hub_id UUID REFERENCES hubs(id),
  pickup_code VARCHAR(10),
  
  -- Completion
  delivered_at TIMESTAMPTZ,
  delivery_notes TEXT,
  signature_url VARCHAR(500),
  delivery_photos JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries" 
  ON deliveries FOR SELECT 
  USING (order_id IN (
    SELECT id FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));
```

## 12. Returns Table (10-Day Policy)

```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- Return Details
  reason VARCHAR(100) NOT NULL,
  reason_details TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'requested',
  -- 'requested', 'approved', 'pickup_scheduled', 'vehicle_received', 'inspected', 'refunded', 'denied'
  
  -- Eligibility
  delivery_date DATE NOT NULL,
  return_deadline DATE NOT NULL, -- delivery_date + 10 days
  mileage_at_delivery INTEGER,
  mileage_at_return INTEGER,
  mileage_driven INTEGER,
  
  -- Inspection
  inspection_notes TEXT,
  damage_found BOOLEAN DEFAULT false,
  damage_description TEXT,
  
  -- Refund
  refund_amount DECIMAL(10,2),
  deductions JSONB, -- { "mileage_fee": 100, "damage": 500 }
  refund_processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);

-- RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns" 
  ON returns FOR SELECT 
  USING (order_id IN (
    SELECT id FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));
```

## 13. Hubs Table

```sql
CREATE TABLE hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  
  -- Address
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(2) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Coordinates
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Hours
  hours JSONB, -- { "monday": "9:00-18:00", ... }
  
  -- Capacity
  vehicle_capacity INTEGER,
  current_inventory INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_pickup_location BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 14. Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Payment Details
  payment_type VARCHAR(30) NOT NULL,
  -- 'deposit', 'full_payment', 'down_payment', 'monthly', 'refund'
  
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  stripe_refund_id VARCHAR(100),
  
  -- Method
  payment_method VARCHAR(30), -- 'card', 'bank_transfer', 'financing'
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Error handling
  error_code VARCHAR(50),
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" 
  ON payments FOR SELECT 
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

## Schema Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  customers  │────<│   orders    │>────│  vehicles   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │            ┌──────┴──────┐           │
       │            │             │           │
       ▼            ▼             ▼           ▼
┌─────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
│  addresses  │ │payments │ │deliveries│ │  photos  │
└─────────────┘ └─────────┘ └──────────┘ └──────────┘
       │
       │
       ▼
┌─────────────────┐     ┌─────────────┐     ┌─────────┐
│financing_apps   │────<│   offers    │>────│ lenders │
└────────┬────────┘     └─────────────┘     └─────────┘
         │
         ▼
   ┌───────────┐     ┌────────────┐     ┌────────┐
   │ trade_ins │     │ inspections│     │  hubs  │
   └───────────┘     └────────────┘     └────────┘
```

*Document Version: 1.0**Last Updated: March 28, 2026*