-- Add dark theme customization columns to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS dark_primary_color TEXT,
ADD COLUMN IF NOT EXISTS dark_background_color TEXT DEFAULT '#0a0a0a',
ADD COLUMN IF NOT EXISTS dark_accent_color TEXT;