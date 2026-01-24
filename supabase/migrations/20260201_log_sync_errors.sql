-- Migration: Add debug table and make sync_auth_user_to_profile resilient by logging errors
-- This is temporary to capture failing cases during /auth/v1/signup; remove or harden after debugging.

CREATE TABLE IF NOT EXISTS public.sync_auth_user_errors (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  error_text TEXT NOT NULL,
  new_payload JSONB
);

-- Replace function to add error logging and enforce safe semester casting
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger AS $$
DECLARE
  v_sem_text TEXT;
  v_sem public.semester_type;
BEGIN
  IF TG_OP = 'INSERT' THEN
    BEGIN
      -- determine semester safely inside the guarded block so casting errors are captured
      v_sem_text := COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1');
      IF v_sem_text NOT IN ('1','2') THEN
        v_sem := '1'::public.semester_type;
      ELSE
        v_sem := v_sem_text::public.semester_type;
      END IF;

      INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', NEW.id::text),
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', ''),
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', ''),
        'user',
        v_sem,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        saram = EXCLUDED.saram,
        full_name = EXCLUDED.full_name,
        rank = EXCLUDED.rank,
        semester = EXCLUDED.semester,
        updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.sync_auth_user_errors(error_text, new_payload) VALUES (SQLERRM, to_jsonb(NEW));
      RAISE;
    END;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN
      -- determine semester safely inside the guarded block
      v_sem_text := COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1');
      IF v_sem_text NOT IN ('1','2') THEN
        v_sem := '1'::public.semester_type;
      ELSE
        v_sem := v_sem_text::public.semester_type;
      END IF;

      UPDATE public.profiles
      SET saram = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', saram),
          full_name = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', full_name),
          rank = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', rank),
          semester = v_sem,
          updated_at = NOW()
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.sync_auth_user_errors(error_text, new_payload) VALUES (SQLERRM, to_jsonb(NEW));
      RAISE;
    END;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO postgres;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;
CREATE TRIGGER auth_user_to_profile_trg
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();
