-- Rollback migration: Restore previous sync_auth_user_to_profile behavior (overwrite on conflict)
-- Use this migration to revert to server-side profile sync that updates existing profiles.
-- Apply only if you want to return to the previous behavior.

-- Recreate function with ON CONFLICT DO UPDATE (previous behavior)
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

ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO postgres;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;
CREATE TRIGGER auth_user_to_profile_trg
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();

-- Restore previous INSERT policy that allowed auth.uid() = id
DROP POLICY IF EXISTS profiles_insert_owner ON public.profiles;
CREATE POLICY profiles_insert_owner
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: This rollback will re-enable server-side updates to existing profile rows on auth.user changes.
-- Ensure this is coordinated with frontend team to avoid clobbering client-submitted profile fields.
