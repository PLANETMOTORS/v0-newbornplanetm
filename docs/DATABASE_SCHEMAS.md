# Planet Motors Database Schema

## 1.11 Deliveries Table

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- Type
  delivery_type VARCHAR(20) NOT NULL,
  -- 'home_delivery', 'pickup', 'hub_transfer'
  
  -- Location
  address_id UUID REFERENCES customer_addresses(id),
  hub_id UUID REFERENCES hubs(id),
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  
  -- Tracking
  status VARCHAR(20) DEFAULT 'pending',
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  tracking_id VARCHAR(100),
  
  -- Timestamps
  dispatched_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_date ON deliveries(scheduled_date);
```

## 1.12 Returns Table (10-Day Policy)

```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Return Details
  return_reason VARCHAR(500),
  condition_notes TEXT,
  
  -- Policy
  purchase_date DATE NOT NULL,
  return_deadline DATE GENERATED ALWAYS AS (purchase_date + 10) STORED,
  is_within_policy BOOLEAN GENERATED ALWAYS AS (CURRENT_DATE <= purchase_date + 10) STORED,
  
  -- Mileage
  mileage_at_purchase INTEGER NOT NULL,
  mileage_at_return INTEGER,
  mileage_driven INTEGER GENERATED ALWAYS AS (mileage_at_return - mileage_at_purchase) STORED,
  
  -- Status
  status VARCHAR(20) DEFAULT 'requested',
  -- 'requested', 'approved', 'inspecting', 'completed', 'denied'
  
  -- Pickup
  pickup_scheduled_date DATE,
  pickup_completed_at TIMESTAMP,
  
  -- Refund
  refund_amount DECIMAL(12,2),
  refund_method VARCHAR(50),
  refund_processed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_customer ON returns(customer_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_deadline ON returns(return_deadline);
```

## 1.13 Hubs Table

```sql
CREATE TABLE hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  
  -- Location
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(100),
  manager_name VARCHAR(100),
  
  -- Operations
  operating_hours JSONB,
  -- {"monday": {"open": "09:00", "close": "20:00"}, ...}
  
  -- Capacity
  vehicle_capacity INTEGER DEFAULT 100,
  current_inventory INTEGER DEFAULT 0,
  
  -- Services
  services_offered TEXT[],
  -- ['sales', 'delivery_pickup', 'test_drive', 'service']
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  -- 'active', 'maintenance', 'closed'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hubs_code ON hubs(code);
CREATE INDEX idx_hubs_city ON hubs(city);
CREATE INDEX idx_hubs_status ON hubs(status);

-- Initial Hub Data (Richmond Hill)
INSERT INTO hubs (name, code, address_line1, city, province, postal_code, phone, email, services_offered)
VALUES (
  'Planet Motors Richmond Hill',
  'PMRH',
  '30 Major Mackenzie E',
  'Richmond Hill',
  'Ontario',
  'L4C 1G7',
  '416-985-2277',
  'richmond@planetmotors.ca',
  ARRAY['sales', 'delivery_pickup', 'test_drive', 'service']
);
```

## 1.14 Vehicles Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  vin VARCHAR(17) UNIQUE NOT NULL,
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Basic Info
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_type VARCHAR(50),
  
  -- Specifications
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  engine VARCHAR(100),
  transmission VARCHAR(50),
  drivetrain VARCHAR(20),
  fuel_type VARCHAR(30),
  
  -- Mileage
  mileage INTEGER NOT NULL,
  mileage_unit VARCHAR(5) DEFAULT 'km',
  
  -- Condition
  condition_rating DECIMAL(3,1),
  accident_history BOOLEAN DEFAULT FALSE,
  mechanical_issues TEXT,
  cosmetic_issues TEXT,
  
  -- Pricing
  msrp_value DECIMAL(12,2),
  offer_amount DECIMAL(12,2),
  listed_value DECIMAL(12,2),
  
  -- Status
  has_lien BOOLEAN DEFAULT FALSE,
  lien_holder VARCHAR(100),
  lien_amount DECIMAL(12,2),
  
  status VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'approved', 'listed', 'reserved', 'sold'
  
  -- EV Specific
  is_electric BOOLEAN DEFAULT FALSE,
  battery_health DECIMAL(5,2),
  range_km INTEGER,
  
  -- Images
  photo_urls TEXT[],
  spin_360_url VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  listed_at TIMESTAMP,
  sold_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_price ON vehicles(listed_value);
```

## 6. MONITORING & OBSERVABILITY

### Metrics Dashboard

| Metric | Warning | Critical | Action |
| --- | --- | --- | --- |
| API Response Time (p95) | > 500ms | > 1000ms | Scale up, optimize queries |
| Error Rate | > 1% | > 5% | Alert on-call, investigate |
| CPU Utilization | > 70% | > 85% | Auto-scale triggers |
| Memory Utilization | > 70% | > 90% | Auto-scale triggers |
| Database Connections | > 80% | > 95% | Connection pooling |

### Alerting Rules

```yaml
# alerts/planetmotors.yaml
groups:
  - name: planetmotors
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          
      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: API response time is slow
          
      - alert: LowInventory
        expr: planetmotors_vehicles_available < 100
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: Vehicle inventory is running low
```

### Logging Structure

```json
{
  "timestamp": "2026-03-27T23:30:00Z",
  "level": "info",
  "service": "vehicle-service",
  "traceId": "abc123",
  "spanId": "def456",
  "message": "Vehicle listed successfully",
  "metadata": {
    "vehicleId": "uuid",
    "vin": "1HGBH41JXMN109186",
    "listPrice": 29995
  }
}
```