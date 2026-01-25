-- Ensure functions have a fixed search_path to avoid search_path attacks
BEGIN;

-- Trigger / simple functions
ALTER FUNCTION public.log_auth_user_insert() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.sync_auth_user_to_profile() SET search_path = public, pg_catalog;

-- RPCs and functions with arguments (use exact arg types)
ALTER FUNCTION public.approve_swap(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_sessions_availability(date, date) SET search_path = public, pg_catalog;
ALTER FUNCTION public.book_session(uuid, uuid) SET search_path = public, pg_catalog;

COMMIT;
