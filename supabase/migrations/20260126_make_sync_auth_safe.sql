-- Migration: Replace sync_auth_user_to_profile trigger with a safe (exception-swallowing) implementation
-- This prevents signup failing if profile creation triggers errors; failures are logged to a persistent table for later inspection.

BEGIN;

-- Create a table to store errors generated during automatic sync from auth.users to profiles
CREATE TABLE IF NOT EXISTS public.sync_auth_user_errors (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NULL,
  error TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a safe function that attempts to insert a minimal profile but logs errors instead of raising them
CREATE OR REPLACE FUNCTION public.safe_sync_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt upsert minimal profile (id required)
  BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  EXCEPTION WHEN others THEN
    -- Log the error and swallow it so signup does not fail
    INSERT INTO public.sync_auth_user_errors (user_id, error) VALUES (NEW.id, SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the existing trigger to call the safe function
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;
CREATE TRIGGER auth_user_to_profile_trg
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.safe_sync_auth_user_to_profile();

COMMIT;
