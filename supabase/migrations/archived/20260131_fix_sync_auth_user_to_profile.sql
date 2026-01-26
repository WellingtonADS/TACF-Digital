-- Migration: Fix sync_auth_user_to_profile trigger to use correct user meta column
-- Reason: Some Supabase versions use raw_user_meta_data; previous function referenced `user_metadata` and raised errors.

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
    ON CONFLICT (id) DO UPDATE SET
      saram = EXCLUDED.saram,
      full_name = EXCLUDED.full_name,
      rank = EXCLUDED.rank,
      semester = EXCLUDED.semester,
      updated_at = NOW();
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

-- Ensure function owner is postgres (needed so SECURITY DEFINER functions run under trusted owner)
ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO postgres;

-- Recreate trigger (idempotent in case already exists)
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;
CREATE TRIGGER auth_user_to_profile_trg
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();
