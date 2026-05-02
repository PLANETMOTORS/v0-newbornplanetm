-- Add 'newsletter' to the allowed values for leads.source CHECK constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN (
  'contact_form','chat','phone','finance_app',
  'trade_in','reservation','test_drive','walk_in',
  'newsletter','referral','other'
));
