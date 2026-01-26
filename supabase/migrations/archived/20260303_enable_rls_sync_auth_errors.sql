-- Enable RLS on sync_auth_user_errors tables and add restrictive policies
BEGIN;

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.sync_auth_user_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sync_auth_user_errors_archive ENABLE ROW LEVEL SECURITY;

-- Policies for runtime (restrict read access to admin users only)
-- Note: Supabase provides `auth.uid()` and `auth.role()` helpers in policy context.
DROP POLICY IF EXISTS sync_auth_user_errors_select ON public.sync_auth_user_errors;
CREATE POLICY sync_auth_user_errors_select
  ON public.sync_auth_user_errors
  FOR SELECT
  USING (auth.role() = 'admin');

DROP POLICY IF EXISTS sync_auth_user_errors_insert ON public.sync_auth_user_errors;
CREATE POLICY sync_auth_user_errors_insert
  ON public.sync_auth_user_errors
  FOR INSERT
  WITH CHECK (true);

-- Archive: restrict SELECT and INSERT similarly
DROP POLICY IF EXISTS sync_auth_user_errors_archive_select ON public.sync_auth_user_errors_archive;
CREATE POLICY sync_auth_user_errors_archive_select
  ON public.sync_auth_user_errors_archive
  FOR SELECT
  USING (auth.role() = 'admin');

DROP POLICY IF EXISTS sync_auth_user_errors_archive_insert ON public.sync_auth_user_errors_archive;
CREATE POLICY sync_auth_user_errors_archive_insert
  ON public.sync_auth_user_errors_archive
  FOR INSERT
  WITH CHECK (true);

COMMIT;
