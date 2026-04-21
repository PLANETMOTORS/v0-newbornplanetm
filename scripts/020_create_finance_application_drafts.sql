-- =====================================================
-- FINANCE APPLICATION DRAFTS TABLE
-- Stores in-progress finance application form data
-- per user, optionally scoped to a vehicle.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS finance_application_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One draft per user per vehicle (NULL vehicle_id = general/pre-approval draft)
CREATE UNIQUE INDEX IF NOT EXISTS uq_drafts_user_vehicle
  ON finance_application_drafts (user_id, COALESCE(vehicle_id, '00000000-0000-0000-0000-000000000000'));

CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON finance_application_drafts (user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_vehicle_id ON finance_application_drafts (vehicle_id) WHERE vehicle_id IS NOT NULL;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON finance_application_drafts;
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON finance_application_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only access their own drafts
ALTER TABLE finance_application_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY drafts_select_own ON finance_application_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY drafts_insert_own ON finance_application_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY drafts_update_own ON finance_application_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY drafts_delete_own ON finance_application_drafts
  FOR DELETE USING (auth.uid() = user_id);
