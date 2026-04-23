-- Migration: Add columns for HomenetIOL CSV feed fields
-- description: Maps from CSV "Comments" column
-- source_vdp_url: Maps from CSV "VDPLink" column (HomenetIOL vehicle detail page URL)
-- title_status: Maps from CSV "TitleStatus" column

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS source_vdp_url TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS title_status VARCHAR(50);
