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

## 1.3 Inspections Table (210-Point)

```sql
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    inspector_name VARCHAR(100) NOT NULL,
    inspection_date DATE NOT NULL,
    
    -- Scoring
    total_points INTEGER DEFAULT 210,
    passed_points INTEGER NOT NULL,
    pass_rate DECIMAL(5,2) GENERATED ALWAYS AS (passed_points::DECIMAL / total_points * 100) STORED,
    overall_status VARCHAR(20) DEFAULT 'passed',
    
    -- Notes
    notes TEXT,
    
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
    category VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_description TEXT,
    status VARCHAR(20) NOT NULL,  -- 'pass', 'fail', 'repaired', 'replaced'
    notes TEXT,
    photo_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
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

## 1.13 Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Payment Details
    payment_type VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(100),
    stripe_charge_id VARCHAR(100),
    stripe_receipt_url VARCHAR(500),
    
    -- Card Details (masked)
    card_brand VARCHAR(20),
    card_last_four VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',
    failure_code VARCHAR(50),
    failure_message TEXT,
    
    -- Timestamps
    processed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
```

## 1.14 Tax Rates Table

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

---

## 2. 210-POINT INSPECTION TEMPLATE

### 2.1 Inspection Categories Table

```sql
CREATE TABLE inspection_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    point_count INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Seed Categories (210 total points)
INSERT INTO inspection_categories (name, point_count, display_order) VALUES
('Exterior', 35, 1),
('Interior', 30, 2),
('Mechanical', 45, 3),
('Electrical', 30, 4),
('Safety', 40, 5),
('Tires & Brakes', 30, 6);
```

### 2.2 Inspection Item Templates Table

```sql
CREATE TABLE inspection_item_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_description TEXT,
    display_order INTEGER DEFAULT 0
);

-- Exterior (35 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Exterior', 'Front Bumper', 'Check for cracks, dents, scratches'),
('Exterior', 'Rear Bumper', 'Check for cracks, dents, scratches'),
('Exterior', 'Hood', 'Check alignment, dents, paint'),
('Exterior', 'Trunk Lid', 'Check alignment, dents, operation'),
('Exterior', 'Driver Front Door', 'Check panel condition, operation'),
('Exterior', 'Driver Rear Door', 'Check panel condition, operation'),
('Exterior', 'Passenger Front Door', 'Check panel condition, operation'),
('Exterior', 'Passenger Rear Door', 'Check panel condition, operation'),
('Exterior', 'Driver Front Fender', 'Check for dents, rust, paint'),
('Exterior', 'Driver Rear Fender', 'Check for dents, rust, paint'),
('Exterior', 'Passenger Front Fender', 'Check for dents, rust, paint'),
('Exterior', 'Passenger Rear Fender', 'Check for dents, rust, paint'),
('Exterior', 'Roof', 'Check for dents, hail damage, rust'),
('Exterior', 'Windshield', 'Check for chips, cracks, clarity'),
('Exterior', 'Rear Window', 'Check for chips, cracks, defroster'),
('Exterior', 'Driver Front Window', 'Check operation, clarity'),
('Exterior', 'Driver Rear Window', 'Check operation, clarity'),
('Exterior', 'Passenger Front Window', 'Check operation, clarity'),
('Exterior', 'Passenger Rear Window', 'Check operation, clarity'),
('Exterior', 'Driver Side Mirror', 'Check operation, condition'),
('Exterior', 'Passenger Side Mirror', 'Check operation, condition'),
('Exterior', 'Headlights', 'Check operation, clarity, alignment'),
('Exterior', 'Tail Lights', 'Check operation, lens condition'),
('Exterior', 'Fog Lights', 'Check operation if equipped'),
('Exterior', 'Turn Signals', 'Check front and rear operation'),
('Exterior', 'Brake Lights', 'Check operation'),
('Exterior', 'Reverse Lights', 'Check operation'),
('Exterior', 'Paint Condition', 'Overall paint quality assessment'),
('Exterior', 'Clear Coat', 'Check for peeling, oxidation'),
('Exterior', 'Emblems & Trim', 'Check all badges and trim pieces'),
('Exterior', 'Door Handles', 'Check operation and condition'),
('Exterior', 'Fuel Door', 'Check operation'),
('Exterior', 'Antenna', 'Check condition if equipped'),
('Exterior', 'Wiper Blades', 'Check condition and operation'),
('Exterior', 'Washer Fluid', 'Check level and spray operation');

-- Interior (30 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Interior', 'Driver Seat', 'Check condition, adjustments, heating'),
('Interior', 'Passenger Seat', 'Check condition, adjustments, heating'),
('Interior', 'Rear Seats', 'Check condition, folding mechanism'),
('Interior', 'Seat Belts', 'Check all belts, retraction, latches'),
('Interior', 'Dashboard', 'Check condition, cracks, gauges'),
('Interior', 'Steering Wheel', 'Check condition, controls, heating'),
('Interior', 'Gear Shift', 'Check operation, condition'),
('Interior', 'Center Console', 'Check storage, cup holders, condition'),
('Interior', 'Glove Box', 'Check operation, light'),
('Interior', 'Door Panels', 'Check all four, condition, controls'),
('Interior', 'Headliner', 'Check condition, sagging'),
('Interior', 'Sun Visors', 'Check operation, mirrors, lights'),
('Interior', 'Rearview Mirror', 'Check condition, auto-dim'),
('Interior', 'Floor Mats', 'Check condition, fit'),
('Interior', 'Carpet', 'Check condition, stains'),
('Interior', 'Trunk/Cargo Area', 'Check condition, carpet, spare'),
('Interior', 'Infotainment System', 'Check operation, screen, audio'),
('Interior', 'Climate Control', 'Check AC, heat, fan speeds'),
('Interior', 'Power Windows', 'Check all window operations'),
('Interior', 'Power Locks', 'Check all door locks'),
('Interior', 'Cruise Control', 'Check operation'),
('Interior', 'Odometer', 'Verify reading matches records'),
('Interior', 'Warning Lights', 'Check for any illuminated warnings'),
('Interior', 'Horn', 'Check operation'),
('Interior', 'Interior Lights', 'Check dome, map, vanity lights'),
('Interior', 'USB Ports', 'Check all ports function'),
('Interior', 'Bluetooth', 'Check pairing and audio'),
('Interior', 'Navigation', 'Check operation if equipped'),
('Interior', 'Backup Camera', 'Check operation, image quality'),
('Interior', 'Parking Sensors', 'Check operation if equipped');

-- Mechanical (45 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Mechanical', 'Engine Oil Level', 'Check level and condition'),
('Mechanical', 'Engine Oil Leaks', 'Inspect for leaks'),
('Mechanical', 'Coolant Level', 'Check level and condition'),
('Mechanical', 'Coolant Leaks', 'Inspect for leaks'),
('Mechanical', 'Transmission Fluid', 'Check level and condition'),
('Mechanical', 'Brake Fluid', 'Check level and condition'),
('Mechanical', 'Power Steering Fluid', 'Check level if equipped'),
('Mechanical', 'Windshield Washer Fluid', 'Check level'),
('Mechanical', 'Engine Start', 'Check cold and warm start'),
('Mechanical', 'Engine Idle', 'Check smooth idle, RPM'),
('Mechanical', 'Engine Noise', 'Listen for abnormal sounds'),
('Mechanical', 'Engine Performance', 'Check acceleration, power'),
('Mechanical', 'Exhaust System', 'Check for leaks, noise, damage'),
('Mechanical', 'Catalytic Converter', 'Check operation, theft protection'),
('Mechanical', 'Transmission Operation', 'Check all gears, smooth shifts'),
('Mechanical', 'Transmission Noise', 'Listen for grinding, whining'),
('Mechanical', 'Drivetrain', 'Check CV joints, u-joints'),
('Mechanical', 'Differential', 'Check for leaks, noise'),
('Mechanical', 'Transfer Case', 'Check if AWD/4WD equipped'),
('Mechanical', 'Suspension - Front Left', 'Check strut, control arm'),
('Mechanical', 'Suspension - Front Right', 'Check strut, control arm'),
('Mechanical', 'Suspension - Rear Left', 'Check shock, springs'),
('Mechanical', 'Suspension - Rear Right', 'Check shock, springs'),
('Mechanical', 'Steering Rack', 'Check for play, leaks'),
('Mechanical', 'Tie Rods', 'Check for wear, play'),
('Mechanical', 'Ball Joints', 'Check for wear, play'),
('Mechanical', 'Wheel Bearings - FL', 'Check for noise, play'),
('Mechanical', 'Wheel Bearings - FR', 'Check for noise, play'),
('Mechanical', 'Wheel Bearings - RL', 'Check for noise, play'),
('Mechanical', 'Wheel Bearings - RR', 'Check for noise, play'),
('Mechanical', 'Drive Belt', 'Check condition, tension'),
('Mechanical', 'Timing Belt/Chain', 'Verify service history'),
('Mechanical', 'Air Filter', 'Check condition'),
('Mechanical', 'Cabin Air Filter', 'Check condition'),
('Mechanical', 'Spark Plugs', 'Verify service history'),
('Mechanical', 'Fuel System', 'Check for leaks, pressure'),
('Mechanical', 'Fuel Cap', 'Check seal, operation'),
('Mechanical', 'Radiator', 'Check condition, leaks, fins'),
('Mechanical', 'Radiator Hoses', 'Check condition, clamps'),
('Mechanical', 'Heater Hoses', 'Check condition, clamps'),
('Mechanical', 'Water Pump', 'Check for leaks, noise'),
('Mechanical', 'Thermostat', 'Verify proper operation'),
('Mechanical', 'Engine Mounts', 'Check for wear, cracks'),
('Mechanical', 'Transmission Mounts', 'Check for wear, cracks'),
('Mechanical', 'Under Carriage', 'Check for rust, damage');

-- Electrical (30 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Electrical', 'Battery', 'Test charge, terminals, age'),
('Electrical', 'Battery Cables', 'Check condition, connections'),
('Electrical', 'Alternator', 'Test output voltage'),
('Electrical', 'Starter', 'Check operation, noise'),
('Electrical', 'Fuse Box', 'Inspect all fuses'),
('Electrical', 'Headlight Switch', 'Check all positions'),
('Electrical', 'Turn Signal Switch', 'Check operation, cancel'),
('Electrical', 'Wiper Switch', 'Check all speeds, intermittent'),
('Electrical', 'Hazard Switch', 'Check operation'),
('Electrical', 'Power Window Motors', 'Check all windows'),
('Electrical', 'Power Lock Actuators', 'Check all doors'),
('Electrical', 'Power Mirror Motors', 'Check adjustment, fold'),
('Electrical', 'Power Seat Motors', 'Check all adjustments'),
('Electrical', 'Sunroof Motor', 'Check if equipped'),
('Electrical', 'Blower Motor', 'Check all speeds'),
('Electrical', 'AC Compressor', 'Check engagement, cooling'),
('Electrical', 'Heated Seats', 'Check if equipped'),
('Electrical', 'Heated Steering', 'Check if equipped'),
('Electrical', 'Remote Start', 'Check if equipped'),
('Electrical', 'Keyless Entry', 'Check both keys'),
('Electrical', 'Push Button Start', 'Check operation'),
('Electrical', 'OBD-II Scan', 'Check for stored codes'),
('Electrical', 'ABS Module', 'Check operation, warning light'),
('Electrical', 'Stability Control', 'Check operation, warning light'),
('Electrical', 'TPMS Sensors', 'Check all four sensors'),
('Electrical', 'Rain Sensor', 'Check if equipped'),
('Electrical', 'Light Sensor', 'Check auto headlights'),
('Electrical', 'Parking Sensors', 'Check front and rear'),
('Electrical', 'Camera System', 'Check all cameras'),
('Electrical', 'Blind Spot Monitoring', 'Check if equipped');

-- Safety (40 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Safety', 'Driver Airbag', 'Check warning light, no recalls'),
('Safety', 'Passenger Airbag', 'Check warning light, no recalls'),
('Safety', 'Side Airbags - Driver', 'Check warning light'),
('Safety', 'Side Airbags - Passenger', 'Check warning light'),
('Safety', 'Curtain Airbags', 'Check warning light'),
('Safety', 'Knee Airbags', 'Check if equipped'),
('Safety', 'Seat Belt - Driver', 'Check operation, pretensioner'),
('Safety', 'Seat Belt - Passenger', 'Check operation, pretensioner'),
('Safety', 'Seat Belt - Rear Left', 'Check operation'),
('Safety', 'Seat Belt - Rear Center', 'Check operation'),
('Safety', 'Seat Belt - Rear Right', 'Check operation'),
('Safety', 'Child Seat Anchors', 'Check LATCH system'),
('Safety', 'Door Locks', 'Check child safety locks'),
('Safety', 'Hood Latch', 'Check primary and safety'),
('Safety', 'Trunk Latch', 'Check operation, emergency release'),
('Safety', 'Brake Pedal', 'Check feel, travel, ABS'),
('Safety', 'Emergency Brake', 'Check operation, adjustment'),
('Safety', 'Brake Warning Light', 'Check not illuminated'),
('Safety', 'ABS Warning Light', 'Check not illuminated'),
('Safety', 'Airbag Warning Light', 'Check not illuminated'),
('Safety', 'TPMS Warning Light', 'Check not illuminated'),
('Safety', 'Check Engine Light', 'Check not illuminated'),
('Safety', 'Forward Collision Warning', 'Check if equipped'),
('Safety', 'Automatic Emergency Braking', 'Check if equipped'),
('Safety', 'Lane Departure Warning', 'Check if equipped'),
('Safety', 'Lane Keep Assist', 'Check if equipped'),
('Safety', 'Adaptive Cruise Control', 'Check if equipped'),
('Safety', 'Rear Cross Traffic Alert', 'Check if equipped'),
('Safety', 'Pedestrian Detection', 'Check if equipped'),
('Safety', 'Head Restraints', 'Check adjustment all seats'),
('Safety', 'Interior Mirror', 'Check auto-dim if equipped'),
('Safety', 'Exterior Mirrors', 'Check heated, blind spot'),
('Safety', 'Horn', 'Check operation'),
('Safety', 'Windshield Wipers', 'Check operation, coverage'),
('Safety', 'Rear Wiper', 'Check if equipped'),
('Safety', 'Defroster - Front', 'Check operation'),
('Safety', 'Defroster - Rear', 'Check operation'),
('Safety', 'Jack & Tools', 'Check presence, condition'),
('Safety', 'Spare Tire', 'Check pressure, condition'),
('Safety', 'First Aid Kit', 'Check if included');

-- Tires & Brakes (30 points)
INSERT INTO inspection_item_templates (category, item_name, item_description) VALUES
('Tires & Brakes', 'Front Left Tire', 'Check tread depth, wear pattern'),
('Tires & Brakes', 'Front Right Tire', 'Check tread depth, wear pattern'),
('Tires & Brakes', 'Rear Left Tire', 'Check tread depth, wear pattern'),
('Tires & Brakes', 'Rear Right Tire', 'Check tread depth, wear pattern'),
('Tires & Brakes', 'Tire Brand/Model', 'Record tire information'),
('Tires & Brakes', 'Tire Age', 'Check DOT date code'),
('Tires & Brakes', 'Tire Pressure - FL', 'Check and adjust'),
('Tires & Brakes', 'Tire Pressure - FR', 'Check and adjust'),
('Tires & Brakes', 'Tire Pressure - RL', 'Check and adjust'),
('Tires & Brakes', 'Tire Pressure - RR', 'Check and adjust'),
('Tires & Brakes', 'Wheel - FL', 'Check for damage, curb rash'),
('Tires & Brakes', 'Wheel - FR', 'Check for damage, curb rash'),
('Tires & Brakes', 'Wheel - RL', 'Check for damage, curb rash'),
('Tires & Brakes', 'Wheel - RR', 'Check for damage, curb rash'),
('Tires & Brakes', 'Lug Nuts', 'Check torque, condition'),
('Tires & Brakes', 'Wheel Alignment', 'Check for pulling, wear'),
('Tires & Brakes', 'Front Brake Pads - Left', 'Measure thickness'),
('Tires & Brakes', 'Front Brake Pads - Right', 'Measure thickness'),
('Tires & Brakes', 'Rear Brake Pads - Left', 'Measure thickness'),
('Tires & Brakes', 'Rear Brake Pads - Right', 'Measure thickness'),
('Tires & Brakes', 'Front Rotors - Left', 'Check thickness, condition'),
('Tires & Brakes', 'Front Rotors - Right', 'Check thickness, condition'),
('Tires & Brakes', 'Rear Rotors - Left', 'Check thickness, condition'),
('Tires & Brakes', 'Rear Rotors - Right', 'Check thickness, condition'),
('Tires & Brakes', 'Brake Calipers', 'Check for leaks, slides'),
('Tires & Brakes', 'Brake Lines', 'Check for leaks, cracks'),
('Tires & Brakes', 'Brake Hoses', 'Check for cracks, bulging'),
('Tires & Brakes', 'ABS Sensors', 'Check all four wheels'),
('Tires & Brakes', 'Parking Brake Shoes', 'Check if drum style'),
('Tires & Brakes', 'Parking Brake Cable', 'Check adjustment, operation');
```
