-- backfill-jose-clauberto-leads.sql
--
-- Manual backfill for the two finance pre-approval submissions from
-- José Clauberto Dos Santos Leal that were lost when the `leads` table
-- did not exist in production. Data sourced from the two notification
-- emails received at toni@planetmotors.ca on 2026-04-30 ~22:24 PDT.
--
-- Run AFTER 20260501_create_leads_table.sql has been applied.
-- Idempotent — re-running with the same email + amount will produce
-- duplicates only if the existing row's `created_at` is older than 5
-- minutes, so check first with the SELECT at the bottom.

-- Lead 1 — original submission (Income $90k / Amount $35k / 72mo)
INSERT INTO public.leads (
  source, status, priority,
  customer_name, customer_email, customer_phone,
  subject, message,
  source_table,
  created_at
)
VALUES (
  'finance_app',
  'new',
  'high',
  'JOSÉ CLAUBERTO DOS SANTOS LEAL',
  'clauberto2023@gmail.com',
  '4372860469',
  'Finance Pre-Approval: $35,000 over 72 months',
  E'Annual income: $90,000\nRequested amount: $35,000\nTerm: 72 months\n\n[BACKFILLED — captured from email notification 2026-04-30 22:24 PDT after leads table was created.]',
  'capture-lead-edge-function',
  '2026-04-30 22:24:00-07'::timestamptz
)
ON CONFLICT DO NOTHING;

-- Lead 2 — revised submission (Income $156k / Amount $70k / 72mo)
INSERT INTO public.leads (
  source, status, priority,
  customer_name, customer_email, customer_phone,
  subject, message,
  source_table,
  created_at
)
VALUES (
  'finance_app',
  'new',
  'high',
  'JOSÉ CLAUBERTO DOS SANTOS LEAL',
  'clauberto2023@gmail.com',
  '4372860469',
  'Finance Pre-Approval: $70,000 over 72 months',
  E'Annual income: $156,000\nRequested amount: $70,000\nTerm: 72 months\n\n[BACKFILLED — captured from email notification 2026-04-30 22:26 PDT after leads table was created.]',
  'capture-lead-edge-function',
  '2026-04-30 22:26:00-07'::timestamptz
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT id, customer_name, customer_email, subject, status, created_at
FROM public.leads
WHERE customer_email = 'clauberto2023@gmail.com'
ORDER BY created_at DESC;
