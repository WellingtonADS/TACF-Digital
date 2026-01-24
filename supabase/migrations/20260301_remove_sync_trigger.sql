-- Draft migration: Remove sync_auth_user_to_profile trigger and function
-- Apply ONLY after client-side upsert is fully rolled out and validated.

-- WARNING: Running this will stop automatic server-side creation of profiles from auth.users
-- Make sure all users have profiles and that client-side upsert is active for all signups.

-- Drop trigger
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;

-- Optionally drop function
DROP FUNCTION IF EXISTS public.sync_auth_user_to_profile();

-- Note: keep this migration ready but apply only after approval and monitoring window
