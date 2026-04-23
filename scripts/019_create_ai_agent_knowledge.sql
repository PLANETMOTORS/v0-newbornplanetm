-- 019_create_ai_agent_knowledge.sql
-- AI Agent Knowledge & Training — Q&A pairs, custom instructions, response rules
-- Allows admins to teach AI agents specific responses: "IF customer asks X, answer Y"

-- ─────────────────────────────────────────
-- ai_agent_knowledge — per-agent knowledge entries
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_agent_knowledge (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type      VARCHAR(20)   NOT NULL
                    CHECK (agent_type IN ('anna','negotiator','valuator')),
  category        VARCHAR(30)   NOT NULL DEFAULT 'qa'
                    CHECK (category IN ('qa','instruction','policy','script','objection')),

  -- The trigger/question pattern
  trigger_phrase  TEXT          NOT NULL,

  -- The trained response
  response        TEXT          NOT NULL,

  -- Metadata
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  priority        INT           NOT NULL DEFAULT 0,  -- Higher = matched first
  tags            TEXT[],                              -- For filtering/grouping

  -- Audit
  created_by      VARCHAR(200),
  updated_by      VARCHAR(200),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; regular users cannot access
DROP POLICY IF EXISTS "Service role full access to ai_agent_knowledge" ON public.ai_agent_knowledge;
CREATE POLICY "Service role full access to ai_agent_knowledge"
  ON public.ai_agent_knowledge FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_agent ON public.ai_agent_knowledge(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_active ON public.ai_agent_knowledge(agent_type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON public.ai_agent_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_priority ON public.ai_agent_knowledge(priority DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_ai_agent_knowledge_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_ai_knowledge_updated_at ON public.ai_agent_knowledge;
CREATE TRIGGER trg_ai_knowledge_updated_at
  BEFORE UPDATE ON public.ai_agent_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_agent_knowledge_updated_at();
