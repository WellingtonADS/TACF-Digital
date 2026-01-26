-- Migration: Ensure functions have a fixed search_path to mitigate search_path attacks
BEGIN;

-- Apply for all functions flagged by linter (idempotent)
ALTER FUNCTION public.log_auth_user_insert() SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_auth_user_insert_to_table() SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_profile_audit() SET search_path = public, pg_catalog;
ALTER FUNCTION public.confirmar_agendamento(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.sync_auth_user_to_profile() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.approve_swap(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.book_session(uuid, uuid) SET search_path = public, pg_catalog;

COMMIT;
