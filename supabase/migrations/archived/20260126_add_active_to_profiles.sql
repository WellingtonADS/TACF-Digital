-- Migration: Add active boolean to profiles for soft-delete/inactivation
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;

-- Ensure existing rows have active = true
UPDATE public.profiles SET active = true WHERE active IS NULL;

-- Index for queries by active status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_active' AND relkind = 'i') THEN
    CREATE INDEX idx_profiles_active ON public.profiles(active);
  END IF;
END$$;

COMMIT;
