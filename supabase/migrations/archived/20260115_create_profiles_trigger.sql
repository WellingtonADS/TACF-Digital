-- Migration: Create trigger to sync auth.users -> public.profiles
-- Creates a trigger and function that inserts/updates a minimal profile when an auth user is created/updated.

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS auth_user_to_profile_trg ON auth.users;

-- Drop existing function if present
DROP FUNCTION IF EXISTS public.sync_auth_user_to_profile();

-- Create function
CREATE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.user_metadata->> 'saram', NEW.id::text),
      COALESCE(NEW.user_metadata->> 'full_name', ''),
      COALESCE(NEW.user_metadata->> 'rank', ''),
      'user',
      COALESCE(NEW.user_metadata->> 'semester', '1'),
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
    SET saram = COALESCE(NEW.user_metadata->> 'saram', saram),
        full_name = COALESCE(NEW.user_metadata->> 'full_name', full_name),
        rank = COALESCE(NEW.user_metadata->> 'rank', rank),
        semester = COALESCE(NEW.user_metadata->> 'semester', semester),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER auth_user_to_profile_trg
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();
