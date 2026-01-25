-- Migration: split sessions SELECT into role-specific policies and remove redundant UPDATE policy
BEGIN;

-- Drop broad public SELECT policy if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'sessions' AND p.polname = 'sessions_select_public'
    ) THEN
        RAISE NOTICE 'Dropping policy "sessions_select_public" on public.sessions';
        EXECUTE 'DROP POLICY IF EXISTS sessions_select_public ON public.sessions';
    ELSE
        RAISE NOTICE 'Policy "sessions_select_public" not found; skipping drop';
    END IF;
END$$;

-- Drop redundant UPDATE policy that duplicates admin permissions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'sessions' AND p.polname = 'sessions_update_admin_only'
    ) THEN
        RAISE NOTICE 'Dropping redundant policy "sessions_update_admin_only" on public.sessions';
        EXECUTE 'DROP POLICY IF EXISTS sessions_update_admin_only ON public.sessions';
    ELSE
        RAISE NOTICE 'Policy "sessions_update_admin_only" not found; skipping drop';
    END IF;
END$$;

-- Create role-specific SELECT policies to avoid multiple permissive policies per role
-- Note: adjust the TO clauses if your Supabase roles differ.
DROP POLICY IF EXISTS sessions_select_anon ON public.sessions;
CREATE POLICY sessions_select_anon ON public.sessions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS sessions_select_authenticated ON public.sessions;
CREATE POLICY sessions_select_authenticated ON public.sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS sessions_select_authenticator ON public.sessions;
CREATE POLICY sessions_select_authenticator ON public.sessions FOR SELECT TO authenticator USING (true);

DROP POLICY IF EXISTS sessions_select_dashboard_user ON public.sessions;
CREATE POLICY sessions_select_dashboard_user ON public.sessions FOR SELECT TO dashboard_user USING (true);

COMMIT;
