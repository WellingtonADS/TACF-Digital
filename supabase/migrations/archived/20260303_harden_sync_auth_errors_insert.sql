-- Harden INSERT policies on sync_auth_user_errors tables: only admin role may insert via PostgREST
BEGIN;

DROP POLICY IF EXISTS sync_auth_user_errors_insert ON public.sync_auth_user_errors;
CREATE POLICY sync_auth_user_errors_insert
  ON public.sync_auth_user_errors
  FOR INSERT
  WITH CHECK (auth.role() = 'admin');

DROP POLICY IF EXISTS sync_auth_user_errors_archive_insert ON public.sync_auth_user_errors_archive;
CREATE POLICY sync_auth_user_errors_archive_insert
  ON public.sync_auth_user_errors_archive
  FOR INSERT
  WITH CHECK (auth.role() = 'admin');

COMMIT;
