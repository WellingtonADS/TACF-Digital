-- Migration: Allow minimal profile creation by making core columns nullable
-- Rationale: Supabase auth signUp may trigger server-side profile creation with minimal data.
-- Temporarily allow NULL on fields so signUp succeeds; client-side onboarding will collect required data.

BEGIN;

ALTER TABLE public.profiles
  ALTER COLUMN full_name DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN rank DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN semester DROP NOT NULL;

COMMIT;
