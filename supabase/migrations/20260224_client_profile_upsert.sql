-- Migration: Make server trigger compatible with client-side profile upsert
-- - Change ON CONFLICT behaviour to DO NOTHING so client upserts are not overwritten
-- - Harden profiles_insert_owner policy to prevent clients from setting `role` arbitrarily

-- Replace function to avoid overwriting client-provided fields on INSERT
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', NEW.id::text),
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', ''),
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', ''),
      'user',
      COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1')::semester_type,
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

-- Harden INSERT policy so client must be auth.uid() and cannot set role to a non-user value
DROP POLICY IF EXISTS profiles_insert_owner ON public.profiles;
CREATE POLICY profiles_insert_owner
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND (role IS NULL OR role = 'user'));

-- Defensive: enforce default role at schema level (if not present)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::text;

-- Note: This migration is intended to be applied before enabling client-side upsert to avoid overwrites.
