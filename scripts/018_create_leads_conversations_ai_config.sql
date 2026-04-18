-- 018_create_leads_conversations_ai_config.sql
-- Leads tracking, chat conversation history, and AI agent configuration

-- ─────────────────────────────────────────
-- leads — unified lead tracking from all sources
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  source          VARCHAR(50)   NOT NULL DEFAULT 'website'
                    CHECK (source IN ('contact_form','chat','phone','finance_app','trade_in','reservation','test_drive','walk_in','referral','other')),
  status          VARCHAR(30)   NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','qualified','negotiating','converted','lost','archived')),
  priority        VARCHAR(10)   NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),

  -- Customer info
  customer_name   VARCHAR(200),
  customer_email  VARCHAR(200),
  customer_phone  VARCHAR(30),
  customer_id     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Context
  vehicle_id      UUID          REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_info    TEXT,
  subject         VARCHAR(300),
  message         TEXT,
  notes           TEXT,

  -- Tracking
  assigned_to     VARCHAR(200),
  contacted_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  conversion_type VARCHAR(50),
  utm_source      VARCHAR(200),
  utm_medium      VARCHAR(200),
  utm_campaign    VARCHAR(200),

  -- Reference to source record
  source_id       UUID,
  source_table    VARCHAR(100),

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; regular users cannot access leads
DROP POLICY IF EXISTS "Service role full access to leads" ON public.leads;
CREATE POLICY "Service role full access to leads"
  ON public.leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_customer_email ON public.leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_leads_updated_at();


-- ─────────────────────────────────────────
-- chat_conversations — Anna conversation history
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      VARCHAR(100)  NOT NULL UNIQUE,
  customer_id     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name   VARCHAR(200),
  customer_email  VARCHAR(200),
  status          VARCHAR(30)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','ended','escalated','converted')),
  vehicle_context JSONB,
  lead_id         UUID          REFERENCES public.leads(id) ON DELETE SET NULL,
  message_count   INT           NOT NULL DEFAULT 0,
  escalated_at    TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to conversations" ON public.chat_conversations;
CREATE POLICY "Service role full access to conversations"
  ON public.chat_conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_session ON public.chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.chat_conversations(created_at DESC);


-- ─────────────────────────────────────────
-- chat_messages — individual messages in conversations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID          NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20)   NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT          NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to messages" ON public.chat_messages;
CREATE POLICY "Service role full access to messages"
  ON public.chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.chat_messages(conversation_id, created_at);


-- ─────────────────────────────────────────
-- ai_agent_config — AI agent settings (override Sanity CMS defaults)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type      VARCHAR(50)   NOT NULL UNIQUE
                    CHECK (agent_type IN ('anna','negotiator','valuator')),
  display_name    VARCHAR(100),
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  system_prompt   TEXT,
  welcome_message TEXT,
  quick_actions   JSONB,
  config          JSONB         NOT NULL DEFAULT '{}',
  updated_by      VARCHAR(200),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to ai config" ON public.ai_agent_config;
CREATE POLICY "Service role full access to ai config"
  ON public.ai_agent_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed default configs
INSERT INTO public.ai_agent_config (agent_type, display_name, is_active, welcome_message, config) VALUES
  ('anna', 'Anna', true, 'Hi! I''m Anna from Planet Motors. How can I help you today?', '{"model":"gpt-4o-mini","temperature":0.7,"maxTokens":1000,"rateLimit":20}'),
  ('negotiator', 'Price Negotiator', true, null, '{"model":"gpt-4o-mini","lowPriceThreshold":30000,"lowPriceMaxDiscount_0_31days":1,"lowPriceMaxDiscount_32_46days":1.25,"lowPriceMaxDiscount_47plus":1.5,"highPriceMaxDiscount_0_46days":0.75,"highPriceMaxDiscount_47plus":1}'),
  ('valuator', 'Vehicle Valuator', true, null, '{"model":"gpt-4o-mini","temperature":0.3}')
ON CONFLICT (agent_type) DO NOTHING;

-- Auto-update updated_at for ai_agent_config
CREATE OR REPLACE FUNCTION public.update_ai_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_ai_config_updated_at ON public.ai_agent_config;
CREATE TRIGGER trg_ai_config_updated_at
  BEFORE UPDATE ON public.ai_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_config_updated_at();
