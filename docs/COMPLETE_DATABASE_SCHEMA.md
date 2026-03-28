# Planet Motors - Complete Database Schema

## 1.1 Vehicles Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) UNIQUE NOT NULL,
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Basic Info
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  body_type VARCHAR(50),
  
  -- Specifications
  engine VARCHAR(100),
  transmission VARCHAR(50),
  drivetrain VARCHAR(20),
  fuel_type VARCHAR(30),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  mileage INTEGER NOT NULL,
  
  -- Pricing
  purchase_price DECIMAL(12,2) NOT NULL,
  listing_price DECIMAL(12,2) NOT NULL,
  msrp DECIMAL(12,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'available',
  location_hub_id UUID REFERENCES hubs(id),
  
  -- Inspection
  inspection_status VARCHAR(20) DEFAULT 'pending',
  inspection_score INTEGER,
  inspection_date TIMESTAMP,
  
  -- Media
  primary_image_url VARCHAR(500),
  spin_360_url VARCHAR(500),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_price ON vehicles(listing_price);
```

## 1.2 Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  
  -- Address
  street_address VARCHAR(255),
  unit VARCHAR(50),
  city VARCHAR(100),
  province VARCHAR(2),
  postal_code VARCHAR(10),
  
  -- Preferences
  marketing_consent BOOLEAN DEFAULT FALSE,
  sms_consent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);
```

## 1.3 Inspections Table

```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  inspector_id UUID REFERENCES employees(id),
  
  -- Scoring
  inspection_date DATE NOT NULL,
  total_points INTEGER DEFAULT 210,
  passed_points INTEGER NOT NULL,
  failed_points INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (passed_points::DECIMAL / total_points * 100) STORED,
  overall_status VARCHAR(20) DEFAULT 'passed',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspections_vehicle ON inspections(vehicle_id);
```

## 1.4 Inspection Items Table

```sql
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id),
  
  -- Item Details
  item_name VARCHAR(200) NOT NULL,
  item_description TEXT,
  status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'repaired', 'replaced'
  notes TEXT,
  photo_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);
```

## 1.5 Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    
    -- Status
    status VARCHAR(30) DEFAULT 'created',
    
    -- Pricing (CAD)
    vehicle_price DECIMAL(12,2) NOT NULL,
    trade_in_credit DECIMAL(12,2) DEFAULT 0,
    down_payment DECIMAL(12,2) DEFAULT 0,
    documentation_fee DECIMAL(12,2) DEFAULT 499.00,
    registration_fee DECIMAL(12,2) DEFAULT 0,
    omvic_fee DECIMAL(12,2) DEFAULT 10.00,
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    warranty_price DECIMAL(12,2) DEFAULT 0,
    
    -- Taxes
    subtotal DECIMAL(12,2) NOT NULL,
    gst_amount DECIMAL(12,2) DEFAULT 0,
    pst_amount DECIMAL(12,2) DEFAULT 0,
    hst_amount DECIMAL(12,2) DEFAULT 0,
    qst_amount DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Financing
    financing_application_id UUID REFERENCES financing_applications(id),
    amount_financed DECIMAL(12,2) DEFAULT 0,
    
    -- Trade-In
    trade_in_id UUID REFERENCES trade_ins(id),
    
    -- Delivery
    delivery_type VARCHAR(20) DEFAULT 'delivery',
    delivery_address_id UUID REFERENCES customer_addresses(id),
    hub_id UUID REFERENCES hubs(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
```

## 1.6 Financing Applications Table

```sql
CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  
  -- Application Details
  status VARCHAR(30) DEFAULT 'pending',
  verification_type VARCHAR(20) DEFAULT 'standard',
  
  -- Employment
  employment_status VARCHAR(30) NOT NULL,
  employer_name VARCHAR(200),
  job_title VARCHAR(100),
  employment_years INTEGER,
  annual_income DECIMAL(12,2),
  
  -- Residence
  residence_status VARCHAR(30),
  monthly_rent_mortgage DECIMAL(12,2),
  residence_years INTEGER,
  
  -- Credit
  credit_score INTEGER,
  credit_bureau VARCHAR(50),
  credit_pull_date TIMESTAMP,
  credit_pull_type VARCHAR(20),
  
  -- Request
  requested_amount DECIMAL(12,2),
  requested_term INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financing_apps_customer ON financing_applications(customer_id);
CREATE INDEX idx_financing_apps_status ON financing_applications(status);
```

## 1.7 Lenders Table

```sql
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  lender_type VARCHAR(30) DEFAULT 'prime',
  
  -- Credit Requirements
  min_credit_score INTEGER,
  max_income DECIMAL(12,2),
  min_income DECIMAL(12,2),
  max_loan_amount DECIMAL(12,2),
  min_loan_amount DECIMAL(12,2),
  min_term_months INTEGER,
  max_term_months INTEGER,
  
  -- Rates
  base_rate DECIMAL(5,3),
  rate_range_min DECIMAL(5,3),
  rate_range_max DECIMAL(5,3),
  
  -- Integration
  api_endpoint VARCHAR(500),
  api_key_secret_name VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Canadian Lenders
INSERT INTO lenders (name, code, lender_type, min_credit_score, base_rate, priority) VALUES
  ('TD Auto Finance', 'TD', 'prime', 680, 4.79, 1),
  ('RBC Auto Finance', 'RBC', 'prime', 700, 4.99, 2),
  ('Scotiabank Dealer Finance', 'SCOTIA', 'prime', 680, 5.19, 3),
  ('BMO Auto Finance', 'BMO', 'prime', 660, 5.49, 4),
  ('CIBC Auto Finance', 'CIBC', 'prime', 650, 5.79, 5),
  ('Desjardins Auto', 'DESJ', 'near-prime', 600, 6.99, 6);
```

## 1.8 Financing Offers Table (Multi-Lender)

```sql
CREATE TABLE financing_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES financing_applications(id),
    lender_id UUID NOT NULL REFERENCES lenders(id),
    
    -- Offer Details
    status VARCHAR(20) DEFAULT 'pending',
    offer_number VARCHAR(50),
    
    -- Terms
    approved_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,3),
    term_months INTEGER,
    monthly_payment DECIMAL(12,2),
    total_interest DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    
    -- Conditions
    down_payment_required DECIMAL(12,2) DEFAULT 0,
    conditions TEXT,
    
    -- Selection
    is_selected BOOLEAN DEFAULT FALSE,
    selected_at TIMESTAMP,
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offers_application ON financing_offers(application_id);
CREATE INDEX idx_offers_lender ON financing_offers(lender_id);
CREATE INDEX idx_offers_selected ON financing_offers(is_selected);
```

## 1.9 Trade-Ins Table

```sql
CREATE TABLE trade_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Vehicle Info
    vin CHAR(17),
    year INTEGER NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    mileage INTEGER NOT NULL,
    exterior_color VARCHAR(50),
    interior_color VARCHAR(50),
    
    -- Condition
    condition_rating VARCHAR(20),
    accident_history BOOLEAN DEFAULT FALSE,
    mechanical_issues TEXT,
    cosmetic_issues TEXT,
    
    -- Valuation
    cbb_value DECIMAL(12,2),
    offer_amount DECIMAL(12,2),
    final_value DECIMAL(12,2),
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',
    
    -- Payoff
    has_lien BOOLEAN DEFAULT FALSE,
    lien_holder VARCHAR(100),
    payoff_amount DECIMAL(12,2),
    
    -- Timestamps
    offer_expires_at TIMESTAMP,
    accepted_at TIMESTAMP,
    inspected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tradein_customer ON trade_ins(customer_id);
CREATE INDEX idx_tradein_status ON trade_ins(status);
```

## 1.10 Deliveries Table

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- Type
  delivery_type VARCHAR(20) NOT NULL, -- 'home', 'hub_pickup'
  hub_id UUID REFERENCES hubs(id),
  
  -- Address (for home delivery)
  street_address VARCHAR(255),
  unit VARCHAR(50),
  city VARCHAR(100),
  province VARCHAR(2),
  postal_code VARCHAR(10),
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time_slot VARCHAR(50),
  estimated_arrival TIMESTAMP,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  driver_id UUID REFERENCES employees(id),
  
  -- Tracking
  tracking_url VARCHAR(500),
  delivered_at TIMESTAMP,
  signature_url VARCHAR(500),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
```

## 1.11 Returns Table (10-Day Policy)

```sql
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Return Details
    return_number VARCHAR(20) UNIQUE NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reason_details TEXT,
    
    -- Policy
    purchase_date DATE NOT NULL,
    return_deadline DATE NOT NULL,
    days_since_purchase INTEGER GENERATED ALWAYS AS (CURRENT_DATE - purchase_date) STORED,
    is_within_policy BOOLEAN GENERATED ALWAYS AS ((CURRENT_DATE - purchase_date) <= 10) STORED,
    
    -- Mileage
    mileage_at_purchase INTEGER NOT NULL,
    mileage_at_return INTEGER,
    mileage_driven INTEGER GENERATED ALWAYS AS (mileage_at_return - mileage_at_purchase) STORED,
    
    -- Status
    status VARCHAR(30) DEFAULT 'requested',
    
    -- Pickup
    pickup_scheduled_date DATE,
    pickup_completed_at TIMESTAMP,
    
    -- Refund
    refund_amount DECIMAL(12,2),
    refund_method VARCHAR(30),
    refund_processed_at TIMESTAMP,
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_customer ON returns(customer_id);
CREATE INDEX idx_returns_status ON returns(status);
```

## 1.12 Hubs Table

```sql
CREATE TABLE hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  hub_type VARCHAR(20) DEFAULT 'full_service',
  
  -- Address
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(2) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Hours
  hours_json JSONB,
  
  -- Capacity
  vehicle_capacity INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Hub
INSERT INTO hubs (name, code, street_address, city, province, postal_code, phone) VALUES
  ('Richmond Hill', 'RHILL', '30 Major Mackenzie E', 'Richmond Hill', 'ON', 'L4C 1J2', '416-985-2277');
```

## 1.13 Tax Rates Table

```sql
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province VARCHAR(2) NOT NULL,
  province_name VARCHAR(50) NOT NULL,
  
  -- Tax Types
  gst_rate DECIMAL(5,4) DEFAULT 0.05,
  pst_rate DECIMAL(5,4) DEFAULT 0,
  hst_rate DECIMAL(5,4) DEFAULT 0,
  qst_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Effective Date
  effective_date DATE DEFAULT CURRENT_DATE,
  
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed Canadian Tax Rates
INSERT INTO tax_rates (province, province_name, gst_rate, pst_rate, hst_rate) VALUES
  ('ON', 'Ontario', 0, 0, 0.13),
  ('BC', 'British Columbia', 0.05, 0.07, 0),
  ('AB', 'Alberta', 0.05, 0, 0),
  ('SK', 'Saskatchewan', 0.05, 0.06, 0),
  ('MB', 'Manitoba', 0.05, 0.07, 0),
  ('QC', 'Quebec', 0.05, 0, 0),
  ('NB', 'New Brunswick', 0, 0, 0.15),
  ('NS', 'Nova Scotia', 0, 0, 0.15),
  ('PE', 'Prince Edward Island', 0, 0, 0.15),
  ('NL', 'Newfoundland and Labrador', 0, 0, 0.15);

-- Quebec uses QST instead of PST
UPDATE tax_rates SET qst_rate = 0.09975 WHERE province = 'QC';
```
