# Planet Motors Production Architecture & Schema

## Complete Database Schema

### Core Tables

1. **customers** - User accounts with Canadian-specific fields
2. **customer_addresses** - Delivery addresses (Canadian postal codes)
3. **vehicles** - Inventory with CBB valuation
4. **vehicle_photos** - Vehicle images
5. **vehicle_features** - Features/options
6. **inspections** - 210-point inspection (Clutch winner)
7. **inspection_items** - Individual inspection points
8. **orders** - Purchase orders with Canadian taxes
9. **financing_applications** - Credit applications
10. **financing_offers** - Multi-lender offers (Carvana winner)
11. **trade_ins** - Trade-in vehicles
12. **payments** - Payment records (Stripe)
13. **deliveries** - Delivery scheduling
14. **returns** - 10-day return policy (Clutch winner)
15. **documents** - Order documents

---

## Canadian Tax Configuration

| Province | Tax Type | Rate |
|----------|----------|------|
| Ontario | HST | 13% |
| British Columbia | GST + PST | 5% + 7% |
| Alberta | GST | 5% |
| Quebec | GST + QST | 5% + 9.975% |
| Nova Scotia | HST | 15% |
| New Brunswick | HST | 15% |
| PEI | HST | 15% |
| Manitoba | GST + PST | 5% + 7% |
| Saskatchewan | GST + PST | 5% + 6% |

---

## Multi-Lender Configuration (Carvana Winner)

| Lender | Type | Min Credit | Max Term |
|--------|------|------------|----------|
| TD Auto Finance | Bank | 600 | 84 months |
| RBC | Bank | 620 | 84 months |
| Scotiabank | Bank | 600 | 84 months |
| BMO | Bank | 640 | 72 months |
| CIBC | Bank | 620 | 84 months |
| Desjardins | Credit Union | 580 | 96 months |

---

## 210-Point Inspection Template (Clutch Winner)

| Category | Points | Items |
|----------|--------|-------|
| Exterior | 35 | Body panels, paint, glass, lights |
| Interior | 30 | Seats, dashboard, controls, HVAC |
| Engine | 40 | Oil, coolant, belts, hoses, emissions |
| Transmission | 20 | Fluid, shifting, clutch |
| Brakes | 25 | Pads, rotors, lines, fluid |
| Suspension | 20 | Shocks, struts, bushings, alignment |
| Electrical | 20 | Battery, alternator, lights, sensors |
| Safety | 20 | Airbags, seatbelts, ADAS |

---

## Vehicle Table Schema

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin CHAR(17) UNIQUE NOT NULL,
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  transmission VARCHAR(50),
  drivetrain VARCHAR(20),
  fuel_type VARCHAR(20),
  engine VARCHAR(100),
  mileage INTEGER NOT NULL,
  
  -- Pricing (Canadian Dollars)
  acquisition_cost DECIMAL(12,2),
  reconditioning_cost DECIMAL(12,2),
  list_price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  msrp DECIMAL(12,2),
  
  -- Valuation
  cbb_value DECIMAL(12,2), -- Canadian Black Book
  valuation_date TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'available',
  location_id UUID REFERENCES locations(id),
  
  -- Flags
  featured BOOLEAN DEFAULT FALSE,
  certified BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  price_drop BOOLEAN DEFAULT FALSE,
  
  -- History
  accident_count INTEGER DEFAULT 0,
  owner_count INTEGER DEFAULT 1,
  carfax_url VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Order Table Schema

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'created',
  
  -- Pricing (CAD)
  vehicle_price DECIMAL(12,2) NOT NULL,
  trade_in_credit DECIMAL(12,2) DEFAULT 0,
  down_payment DECIMAL(12,2) DEFAULT 0,
  documentation_fee DECIMAL(12,2) DEFAULT 499.00,
  registration_fee DECIMAL(12,2),
  omvic_fee DECIMAL(12,2) DEFAULT 10.00, -- Ontario only
  
  -- Canadian Taxes
  province VARCHAR(2) NOT NULL,
  gst_rate DECIMAL(5,4),
  pst_rate DECIMAL(5,4),
  hst_rate DECIMAL(5,4),
  qst_rate DECIMAL(5,4),
  tax_amount DECIMAL(12,2) NOT NULL,
  
  -- Totals
  subtotal DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  amount_financed DECIMAL(12,2),
  
  -- Financing
  financing_application_id UUID REFERENCES financing_applications(id),
  financing_offer_id UUID REFERENCES financing_offers(id),
  
  -- Trade-In
  trade_in_id UUID REFERENCES trade_ins(id),
  
  -- Delivery
  delivery_type VARCHAR(20), -- 'delivery' or 'pickup'
  delivery_address_id UUID REFERENCES customer_addresses(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## Financing Application Schema

```sql
CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Applicant Info (encrypted)
  sin_encrypted BYTEA, -- Social Insurance Number
  date_of_birth DATE NOT NULL,
  
  -- Employment
  employment_status VARCHAR(20),
  employer_name VARCHAR(100),
  job_title VARCHAR(100),
  annual_income DECIMAL(12,2),
  months_employed INTEGER,
  
  -- Housing
  housing_status VARCHAR(20),
  monthly_housing_payment DECIMAL(12,2),
  
  -- Loan Request
  requested_amount DECIMAL(12,2),
  requested_term INTEGER, -- months
  down_payment DECIMAL(12,2),
  
  -- Credit (from bureau)
  credit_score INTEGER,
  credit_pull_type VARCHAR(10), -- 'soft' or 'hard'
  credit_pull_date TIMESTAMP,
  bureau VARCHAR(20), -- 'equifax' or 'transunion'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  decided_at TIMESTAMP
);

CREATE TABLE financing_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES financing_applications(id) NOT NULL,
  lender_id VARCHAR(50) NOT NULL,
  
  -- Offer Details
  status VARCHAR(20) DEFAULT 'pending',
  approved_amount DECIMAL(12,2),
  apr DECIMAL(5,2),
  term_months INTEGER,
  monthly_payment DECIMAL(12,2),
  
  -- Conditions
  down_payment_required DECIMAL(12,2),
  conditions TEXT[],
  
  -- Selection
  selected BOOLEAN DEFAULT FALSE,
  selected_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## Inspection Schema

```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  inspection_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Inspector
  inspector_id UUID REFERENCES employees(id),
  inspection_date TIMESTAMP NOT NULL,
  
  -- Results
  total_points INTEGER DEFAULT 210,
  passed_points INTEGER NOT NULL,
  failed_points INTEGER NOT NULL,
  overall_score DECIMAL(5,2), -- percentage
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed',
  passed BOOLEAN NOT NULL,
  
  -- Notes
  notes TEXT,
  recommendations TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id) NOT NULL,
  
  -- Category
  category VARCHAR(50) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  
  -- Result
  status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'repaired', 'na'
  notes TEXT,
  photo_url VARCHAR(500),
  
  -- Repair (if applicable)
  repair_required BOOLEAN DEFAULT FALSE,
  repair_completed BOOLEAN DEFAULT FALSE,
  repair_cost DECIMAL(10,2),
  repair_date TIMESTAMP
);
```

---

## Security Layers

| Layer | Implementation | Description |
|-------|---------------|-------------|
| Edge | AWS Shield Advanced | DDoS protection, managed rules |
| Network | VPC, Security Groups | Network isolation |
| Application | Helmet.js, express-validator | Headers, input validation |
| Data | AWS KMS, column encryption | PII encryption |
| Access | IAM, JWT | Authentication, authorization |

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load (LCP) | < 2.5s | - |
| API Response (p95) | < 200ms | - |
| Search Results | < 500ms | - |
| Image Load (360) | < 1s per frame | - |
| Uptime | 99.9% | - |

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Classification: Internal Use Only*
