-- Migration: remove sessions_admin_manage and add admin-only UPDATE/DELETE policies
BEGIN;

-- Drop the broad admin manage policy if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'sessions' AND p.polname = 'sessions_admin_manage'
    ) THEN
        RAISE NOTICE 'Dropping policy "sessions_admin_manage" on public.sessions';
        EXECUTE 'DROP POLICY IF EXISTS sessions_admin_manage ON public.sessions';
    ELSE
        RAISE NOTICE 'Policy "sessions_admin_manage" not found; skipping drop';
    END IF;
END$$;

-- Create admin-only UPDATE policy (applies only to authenticated connections)
DROP POLICY IF EXISTS sessions_update_admin_only ON public.sessions;
CREATE POLICY sessions_update_admin_only ON public.sessions FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = (SELECT auth.uid() AS uid) AND p.role = 'admin'::user_role
    )
);

-- Create admin-only DELETE policy
DROP POLICY IF EXISTS sessions_delete_admin_only ON public.sessions;
CREATE POLICY sessions_delete_admin_only ON public.sessions FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = (SELECT auth.uid() AS uid) AND p.role = 'admin'::user_role
    )
);

COMMIT;
