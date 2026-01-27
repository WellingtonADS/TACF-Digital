-- Migration: Allow profiles.saram to be NULL
-- Rationale: Signups were failing due to server-side profile creation requiring NOT NULL saram.
-- We make the column nullable so users can sign up without providing SARAM (which will be generated later at booking).

BEGIN;

ALTER TABLE public.profiles
  ALTER COLUMN saram DROP NOT NULL;

-- Ensure index still exists (unique index allows multiple NULLs in Postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_saram' AND relkind = 'i') THEN
    CREATE INDEX idx_profiles_saram ON public.profiles(saram);
  END IF;
END$$;

COMMIT;
