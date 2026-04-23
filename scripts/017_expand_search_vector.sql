-- Migration: Expand search_vector to include VIN, stock_number, year, and body_style aliases
-- This enables customers to search by VIN, stock number, year, and common terms like "SUV"/"Sedan"
--
-- IMPORTANT: This migration alters the generated column definition.
-- PostgreSQL requires DROP + ADD for generated columns (ALTER alone is not supported).

-- Step 1: Drop the existing generated column
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS search_vector;

-- Step 2: Re-create with expanded fields
ALTER TABLE public.vehicles ADD COLUMN search_vector TSVECTOR GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(make, '') || ' ' || 
    coalesce(model, '') || ' ' || 
    coalesce(trim, '') || ' ' || 
    coalesce(body_style, '') || ' ' ||
    coalesce(exterior_color, '') || ' ' ||
    coalesce(vin, '') || ' ' ||
    coalesce(stock_number, '') || ' ' ||
    coalesce(year::text, '') || ' ' ||
    CASE WHEN body_style ILIKE '%Sport Utility%' THEN 'SUV' ELSE '' END || ' ' ||
    CASE WHEN body_style ILIKE '%4dr Car%' THEN 'Sedan' ELSE '' END
  )
) STORED;

-- Step 3: Re-create the GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON public.vehicles USING GIN(search_vector);
