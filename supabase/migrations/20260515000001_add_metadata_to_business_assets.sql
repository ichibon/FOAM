-- Add metadata JSONB column to business_assets for storing van/location extra fields.
ALTER TABLE public.business_assets
  ADD COLUMN IF NOT EXISTS metadata jsonb;
