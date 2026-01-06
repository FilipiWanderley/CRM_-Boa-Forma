-- Add font and favicon customization columns to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS favicon_url TEXT;