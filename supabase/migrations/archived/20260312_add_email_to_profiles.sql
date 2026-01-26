-- Migration: Add email to profiles and update sync trigger to persist email from auth.users

-- 1) Add column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2) Backfill from auth.users for existing rows where possible
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3) Add a case-insensitive unique index to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (LOWER(email));

-- 4) Ensure sync_auth_user_to_profile writes/updates email
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, email, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', NEW.id::text),
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', ''),
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', ''),
      'user',
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1')::semester_type,
      NEW.email,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET saram = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', saram),
        full_name = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', full_name),
        rank = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', rank),
        semester = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', semester)::semester_type,
        email = COALESCE(NEW.email, email),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO postgres;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;
CREATE TRIGGER auth_user_to_profile_trg
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();
