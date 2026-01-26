-- Rollback migration for persist_sync_trigger_fix
-- This rollback attempts to restore a safe stub for the trigger function
-- and will DROP enums only if they have no dependent objects.

-- 1) Replace function by a minimal safe stub (no inserts) to rollback behavior
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_auth_user_to_profile') THEN
    CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
     RETURNS trigger
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $fn$
    BEGIN
      -- rollback stub: do not modify public.profiles
      RETURN NEW;
    END;
    $fn$;
    EXECUTE format('ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO %I', current_user);
  END IF;
END$$;

-- 2) Drop enums only if no dependencies exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='semester_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_depend d
      JOIN pg_catalog.pg_type t ON d.refobjid = t.oid
      WHERE t.typname = 'semester_type'
    ) THEN
      DROP TYPE IF EXISTS public.semester_type;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_depend d
      JOIN pg_catalog.pg_type t ON d.refobjid = t.oid
      WHERE t.typname = 'user_role'
    ) THEN
      DROP TYPE IF EXISTS public.user_role;
    END IF;
  END IF;

END$$;
