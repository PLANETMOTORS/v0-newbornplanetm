-- =====================================================
-- COMPREHENSIVE FINANCE APPLICATION SCHEMA
-- Planet Motors - DealerTrack-style Finance Applications
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. FINANCE APPLICATIONS (Main table)
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_applications_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'declined', 'funded', 'cancelled')),
  
  -- Agreement type
  agreement_type VARCHAR(20) DEFAULT 'finance' CHECK (agreement_type IN ('finance', 'cash', 'lease')),
  
  -- Vehicle reference (can be null for pre-approval)
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- User/Customer reference
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Financing terms requested
  requested_amount DECIMAL(12,2),
  down_payment DECIMAL(12,2) DEFAULT 0,
  max_down_payment DECIMAL(12,2),
  loan_term_months INTEGER DEFAULT 72 CHECK (loan_term_months IN (24, 36, 48, 60, 72, 84, 96)),
  payment_frequency VARCHAR(20) DEFAULT 'bi-weekly' CHECK (payment_frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly')),
  interest_rate DECIMAL(5,2),
  
  -- Admin/fees
  admin_fee DECIMAL(10,2) DEFAULT 895,
  sales_tax_rate DECIMAL(5,2) DEFAULT 13,
  
  -- Trade-in
  has_trade_in BOOLEAN DEFAULT FALSE,
  trade_in_vehicle_id UUID,
  trade_in_value DECIMAL(12,2),
  trade_in_lien_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated values (stored for record)
  total_amount_financed DECIMAL(12,2),
  estimated_payment DECIMAL(10,2),
  total_interest DECIMAL(12,2),
  total_to_repay DECIMAL(12,2),
  
  -- Notes
  additional_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ
);

-- =====================================================
-- 2. APPLICANTS (Primary and Co-Applicants)
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES finance_applications_v2(id) ON DELETE CASCADE,
  
  -- Applicant type
  applicant_type VARCHAR(20) DEFAULT 'primary' CHECK (applicant_type IN ('primary', 'co-applicant', 'co-signer', 'guarantor')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Relation to primary (for co-applicants)
  relation_to_primary VARCHAR(50),
  
  -- ==================
  -- PERSONAL INFORMATION
  -- ==================
  salutation VARCHAR(10) CHECK (salutation IN ('Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Prof.')),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  suffix VARCHAR(10),
  
  -- Identity
  sin_encrypted TEXT, -- Social Insurance Number (encrypted)
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'common_law', 'divorced', 'separated', 'widowed')),
  
  -- Contact
  phone VARCHAR(20),
  mobile_phone VARCHAR(20),
  email VARCHAR(255),
  no_email BOOLEAN DEFAULT FALSE,
  language_preference VARCHAR(10) DEFAULT 'en' CHECK (language_preference IN ('en', 'fr')),
  
  -- Self-reported credit rating
  credit_rating VARCHAR(20) CHECK (credit_rating IN ('excellent', 'good', 'average', 'poor', 'unknown')),
  credit_score INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. APPLICANT ADDRESSES
-- =====================================================
CREATE TABLE IF NOT EXISTS applicant_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES finance_applicants(id) ON DELETE CASCADE,
  
  -- Address type
  address_type VARCHAR(20) DEFAULT 'current' CHECK (address_type IN ('current', 'previous', 'mailing')),
  
  -- Full address
  address_line VARCHAR(10) CHECK (address_line IN ('house', 'apartment', 'condo', 'townhouse', 'other')),
  suite_number VARCHAR(20),
  street_number VARCHAR(20),
  street_name VARCHAR(255),
  street_type VARCHAR(50), -- Ave, St, Blvd, etc.
  street_direction VARCHAR(10), -- N, S, E, W, NE, NW, SE, SW
  city VARCHAR(100),
  province VARCHAR(50) DEFAULT 'Ontario',
  postal_code VARCHAR(10),
  country VARCHAR(50) DEFAULT 'Canada',
  
  -- Duration at address
  duration_years INTEGER DEFAULT 0,
  duration_months INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. HOME/MORTGAGE DETAILS
-- =====================================================
CREATE TABLE IF NOT EXISTS applicant_housing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES finance_applicants(id) ON DELETE CASCADE,
  
  -- Home ownership
  home_status VARCHAR(30) CHECK (home_status IN ('own', 'rent', 'live_with_parents', 'other')),
  market_value DECIMAL(12,2),
  
  -- Mortgage details (if applicable)
  mortgage_amount DECIMAL(12,2),
  mortgage_holder VARCHAR(255),
  monthly_payment DECIMAL(10,2),
  
  -- Outstanding mortgage
  outstanding_mortgage DECIMAL(12,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. EMPLOYMENT INFORMATION
-- =====================================================
CREATE TABLE IF NOT EXISTS applicant_employment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES finance_applicants(id) ON DELETE CASCADE,
  
  -- Employment type
  employment_type VARCHAR(20) DEFAULT 'current' CHECK (employment_type IN ('current', 'previous')),
  employment_category VARCHAR(30) CHECK (employment_category IN ('full_time', 'part_time', 'self_employed', 'retired', 'student', 'unemployed', 'disability', 'other')),
  employment_status VARCHAR(30) CHECK (employment_status IN ('employed', 'probation', 'contract', 'seasonal', 'temporary')),
  
  -- Employer details
  employer_name VARCHAR(255),
  occupation VARCHAR(255),
  job_title VARCHAR(255),
  
  -- Employer address
  employer_address_type VARCHAR(10),
  employer_suite_number VARCHAR(20),
  employer_street_number VARCHAR(20),
  employer_street_name VARCHAR(255),
  employer_street_type VARCHAR(50),
  employer_street_direction VARCHAR(10),
  employer_city VARCHAR(100),
  employer_province VARCHAR(50),
  employer_postal_code VARCHAR(10),
  employer_phone VARCHAR(20),
  employer_phone_ext VARCHAR(10),
  
  -- Duration of employment
  duration_years INTEGER DEFAULT 0,
  duration_months INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INCOME DETAILS
-- =====================================================
CREATE TABLE IF NOT EXISTS applicant_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES finance_applicants(id) ON DELETE CASCADE,
  
  -- Primary income
  gross_income DECIMAL(12,2) NOT NULL,
  income_frequency VARCHAR(20) DEFAULT 'annually' CHECK (income_frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly', 'annually')),
  
  -- Other income
  other_income_type VARCHAR(50), -- pension, rental, investment, child support, etc.
  other_income_amount DECIMAL(12,2),
  other_income_frequency VARCHAR(20) CHECK (other_income_frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly', 'annually')),
  other_income_description TEXT,
  
  -- Calculated annual total
  annual_total DECIMAL(12,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. FINANCE APPLICATION DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES finance_applications_v2(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES finance_applicants(id) ON DELETE CASCADE,
  
  -- Document info
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'drivers_license', 'passport', 'provincial_id', 'health_card',
    'proof_of_income', 'pay_stub', 't4_slip', 'bank_statement',
    'proof_of_address', 'utility_bill', 'void_cheque',
    'vehicle_registration', 'insurance', 'other'
  )),
  document_name VARCHAR(255),
  
  -- File storage
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at DATE
);

-- =====================================================
-- 8. TRADE-IN VEHICLES
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_trade_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES finance_applications_v2(id) ON DELETE CASCADE,
  
  -- Vehicle details
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR(100),
  model VARCHAR(100),
  trim VARCHAR(100),
  color VARCHAR(50),
  mileage INTEGER,
  
  -- Condition
  condition VARCHAR(20) CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  
  -- Valuation
  estimated_value DECIMAL(12,2),
  offered_value DECIMAL(12,2),
  
  -- Lien info
  has_lien BOOLEAN DEFAULT FALSE,
  lien_holder VARCHAR(255),
  lien_amount DECIMAL(12,2),
  
  -- Net trade value
  net_trade_value DECIMAL(12,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. APPLICATION STATUS HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_application_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES finance_applications_v2(id) ON DELETE CASCADE,
  
  -- Status change
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  
  -- Notes
  notes TEXT,
  
  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_finance_apps_v2_status ON finance_applications_v2(status);
CREATE INDEX IF NOT EXISTS idx_finance_apps_v2_user ON finance_applications_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_apps_v2_vehicle ON finance_applications_v2(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_finance_apps_v2_number ON finance_applications_v2(application_number);

CREATE INDEX IF NOT EXISTS idx_applicants_application ON finance_applicants(application_id);
CREATE INDEX IF NOT EXISTS idx_applicants_type ON finance_applicants(applicant_type);

CREATE INDEX IF NOT EXISTS idx_addresses_applicant ON applicant_addresses(applicant_id);
CREATE INDEX IF NOT EXISTS idx_housing_applicant ON applicant_housing(applicant_id);
CREATE INDEX IF NOT EXISTS idx_employment_applicant ON applicant_employment(applicant_id);
CREATE INDEX IF NOT EXISTS idx_income_applicant ON applicant_income(applicant_id);

CREATE INDEX IF NOT EXISTS idx_documents_application ON finance_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON finance_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_trade_ins_application ON finance_trade_ins(application_id);
CREATE INDEX IF NOT EXISTS idx_history_application ON finance_application_history(application_id);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_finance_applications_v2_updated_at ON finance_applications_v2;
CREATE TRIGGER update_finance_applications_v2_updated_at
  BEFORE UPDATE ON finance_applications_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_applicants_updated_at ON finance_applicants;
CREATE TRIGGER update_finance_applicants_updated_at
  BEFORE UPDATE ON finance_applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Generate Application Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number = 'PM-FA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_app_number ON finance_applications_v2;
CREATE TRIGGER generate_app_number
  BEFORE INSERT ON finance_applications_v2
  FOR EACH ROW EXECUTE FUNCTION generate_application_number();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE finance_applications_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_housing ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_application_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON finance_applications_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON finance_applications_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON finance_applications_v2 FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));

-- Applicants linked to user's applications
CREATE POLICY "Users can manage applicants"
  ON finance_applicants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applications_v2 
      WHERE id = finance_applicants.application_id 
      AND user_id = auth.uid()
    )
  );

-- Similar policies for related tables
CREATE POLICY "Users can manage addresses"
  ON applicant_addresses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applicants fa
      JOIN finance_applications_v2 app ON fa.application_id = app.id
      WHERE fa.id = applicant_addresses.applicant_id 
      AND app.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage housing"
  ON applicant_housing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applicants fa
      JOIN finance_applications_v2 app ON fa.application_id = app.id
      WHERE fa.id = applicant_housing.applicant_id 
      AND app.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage employment"
  ON applicant_employment FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applicants fa
      JOIN finance_applications_v2 app ON fa.application_id = app.id
      WHERE fa.id = applicant_employment.applicant_id 
      AND app.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage income"
  ON applicant_income FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applicants fa
      JOIN finance_applications_v2 app ON fa.application_id = app.id
      WHERE fa.id = applicant_income.applicant_id 
      AND app.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage documents"
  ON finance_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applications_v2 
      WHERE id = finance_documents.application_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage trade-ins"
  ON finance_trade_ins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM finance_applications_v2 
      WHERE id = finance_trade_ins.application_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view application history"
  ON finance_application_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM finance_applications_v2 
      WHERE id = finance_application_history.application_id 
      AND user_id = auth.uid()
    )
  );
