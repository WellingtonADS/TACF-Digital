-- Migration: drop duplicate permissive policy on public.sessions
-- Removes the redundant policy named "Sessions public view" keeping the intended "sessions_select_public" policy.
BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'sessions' AND p.polname = 'Sessions public view'
    ) THEN
        RAISE NOTICE 'Dropping policy "Sessions public view" on public.sessions';
        EXECUTE 'DROP POLICY "Sessions public view" ON public.sessions';
    ELSE
        RAISE NOTICE 'Policy "Sessions public view" not found; nothing to drop';
    END IF;
END$$;

COMMIT;
