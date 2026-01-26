-- Migration: Ensure role default and add CHECK constraint for safety
-- - Set missing/null role values to 'user'
-- - Add CHECK constraint to allow only expected role values
-- - This migration is idempotent.

BEGIN;

-- Set NULL roles to 'user' to avoid constraint violations
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- Add CHECK constraint if not exists (Postgres doesn't have IF NOT EXISTS for ADD CONSTRAINT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'profiles_role_check' AND n.nspname = 'public' AND t.relname = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'coordinator'));
  END IF;
END$$;

COMMIT;

-- Note: this enforces allowed role values. Client-side upserts are still prevented from setting role by policy.
