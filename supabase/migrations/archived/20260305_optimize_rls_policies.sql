-- Migration: Optimize RLS policies for performance
-- Replace direct calls to auth.*() with (select auth.*()) to avoid re-evaluation per row
-- Consolidate multiple permissive policies into single policies per action where safe
BEGIN;

-- PROFILES: consolidate/select/update/insert policies
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_owner ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin_only ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY profiles_select_owner_or_admin
  ON public.profiles
  FOR SELECT
  USING (( (select auth.uid()) = id ) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = ANY (ARRAY['admin'::user_role,'coordinator'::user_role]))));

CREATE POLICY profiles_insert_owner
  ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY profiles_update_owner_or_admin
  ON public.profiles
  FOR UPDATE
  USING (( (select auth.uid()) = id ) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role)))
  WITH CHECK (( (select auth.uid()) = id ) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role)));

-- BOOKINGS: consolidate select/insert/update/delete policies
DROP POLICY IF EXISTS "Admins view all bookings" ON public.bookings;
DROP POLICY IF EXISTS bookings_select_owner_or_admin ON public.bookings;
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS bookings_insert_owner ON public.bookings;
DROP POLICY IF EXISTS bookings_update_admin_only ON public.bookings;
DROP POLICY IF EXISTS bookings_delete_admin_only ON public.bookings;

CREATE POLICY bookings_select_owner_or_admin
  ON public.bookings
  FOR SELECT
  USING (( (select auth.uid()) = user_id ) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = ANY (ARRAY['admin'::user_role,'coordinator'::user_role]))));

CREATE POLICY bookings_insert_owner
  ON public.bookings
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY bookings_update_admin_only
  ON public.bookings
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role));

CREATE POLICY bookings_delete_admin_only
  ON public.bookings
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role));

-- SESSIONS: consolidate public select and admin policies
DROP POLICY IF EXISTS "Admins manage sessions" ON public.sessions;
DROP POLICY IF EXISTS sessions_select_public ON public.sessions;
DROP POLICY IF EXISTS sessions_update_admin_only ON public.sessions;

CREATE POLICY sessions_select_public
  ON public.sessions
  FOR SELECT
  USING (true);

CREATE POLICY sessions_admin_manage
  ON public.sessions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role));

CREATE POLICY sessions_update_admin_only
  ON public.sessions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role));

-- SWAP_REQUESTS: consolidate
DROP POLICY IF EXISTS "Admins manage swaps" ON public.swap_requests;
DROP POLICY IF EXISTS swap_requests_insert_owner ON public.swap_requests;
DROP POLICY IF EXISTS swap_requests_select_owner_or_admin ON public.swap_requests;
DROP POLICY IF EXISTS swap_requests_update_admin_only ON public.swap_requests;
DROP POLICY IF EXISTS "Users view/create own swaps" ON public.swap_requests;

CREATE POLICY swap_requests_select_owner_or_admin
  ON public.swap_requests
  FOR SELECT
  USING (( (select auth.uid()) = requested_by ) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = ANY (ARRAY['admin'::user_role,'coordinator'::user_role]))));

CREATE POLICY swap_requests_insert_owner
  ON public.swap_requests
  FOR INSERT
  WITH CHECK ((select auth.uid()) = requested_by);

CREATE POLICY swap_requests_update_admin_only
  ON public.swap_requests
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'::user_role));

-- SYNC AUTH ERRORS: use select(auth.role()) in policies
DROP POLICY IF EXISTS sync_auth_user_errors_select ON public.sync_auth_user_errors;
DROP POLICY IF EXISTS sync_auth_user_errors_insert ON public.sync_auth_user_errors;
DROP POLICY IF EXISTS sync_auth_user_errors_archive_select ON public.sync_auth_user_errors_archive;
DROP POLICY IF EXISTS sync_auth_user_errors_archive_insert ON public.sync_auth_user_errors_archive;

CREATE POLICY sync_auth_user_errors_select
  ON public.sync_auth_user_errors
  FOR SELECT
  USING ((select auth.role()) = 'admin');

CREATE POLICY sync_auth_user_errors_insert
  ON public.sync_auth_user_errors
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'admin');

CREATE POLICY sync_auth_user_errors_archive_select
  ON public.sync_auth_user_errors_archive
  FOR SELECT
  USING ((select auth.role()) = 'admin');

CREATE POLICY sync_auth_user_errors_archive_insert
  ON public.sync_auth_user_errors_archive
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'admin');

COMMIT;
