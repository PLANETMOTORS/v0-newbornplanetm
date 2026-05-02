-- 20260501_create_user_favorites_table.sql
--
-- Persisted "saved vehicles" / heart icon for signed-in customers.
--
-- Background
-- ----------
-- The favourites context (`contexts/favorites-context.tsx`) was shipped
-- with a documented CREATE TABLE statement embedded in a comment block
-- but no actual migration. The table existed in our staging Supabase
-- project but was never created in production, so every authenticated
-- page request that mounts the FavoritesProvider hits a 404 chain
-- against `user_favorites` in the Network panel and the heart icon on
-- VDPs/listings silently does nothing for real customers.
--
-- This migration is the canonical, idempotent definition of the table
-- so any fresh Supabase project (or a `supabase db push` against
-- production) gets the same shape automatically.
--
-- Safe to re-run: every CREATE uses IF NOT EXISTS, the policy is
-- DROP-then-CREATE, and the unique index protects against double-saves.

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id   TEXT         NOT NULL,
  vehicle_data JSONB        NOT NULL,
  saved_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, vehicle_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
CREATE POLICY "Users manage own favorites"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id
  ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_saved_at
  ON public.user_favorites(saved_at DESC);

COMMENT ON TABLE public.user_favorites IS
  'Persisted hearted/saved vehicles per signed-in customer. JSONB column caches the vehicle snapshot so the saved card renders even if the source listing is later removed.';
