CREATE POLICY audit_logs_admin_read ON public.audit_logs FOR SELECT TO "0" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role) AND (COALESCE(p.active, true) = true)))));
CREATE POLICY auth_inserts_insert ON public.auth_inserts FOR INSERT TO "0" WITH CHECK ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY auth_inserts_select ON public.auth_inserts FOR SELECT TO "0" USING ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY bookings_delete_admin_only ON public.bookings FOR DELETE TO "0" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));
CREATE POLICY bookings_insert_owner ON public.bookings FOR INSERT TO "0" WITH CHECK ((auth.uid() = user_id));
CREATE POLICY bookings_select_owner_or_admin ON public.bookings FOR SELECT TO "0" USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::user_role, 'coordinator'::user_role])))))));
CREATE POLICY location_schedules_select_all ON public.location_schedules FOR SELECT TO "0" USING (true);
CREATE POLICY locations_delete_admin_only ON public.locations FOR DELETE TO "0" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role) AND (COALESCE(p.active, true) = true)))));
CREATE POLICY locations_insert_admin_only ON public.locations FOR INSERT TO "0" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role) AND (COALESCE(p.active, true) = true)))));
CREATE POLICY locations_select_public ON public.locations FOR SELECT TO "0" USING (true);
CREATE POLICY profiles_insert_owner ON public.profiles FOR INSERT TO "0" WITH CHECK ((auth.uid() = id));
CREATE POLICY profiles_select_owner_or_admin ON public.profiles FOR SELECT TO "0" USING ((auth.uid() IS NOT NULL));
CREATE POLICY sessions_delete_admin_only ON public.sessions FOR DELETE TO "16481" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role) AND (COALESCE(p.active, true) = true)))));
CREATE POLICY sessions_insert_admin_only ON public.sessions FOR INSERT TO "16481" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role) AND (COALESCE(p.active, true) = true)))));
CREATE POLICY sessions_select_anon ON public.sessions FOR SELECT TO "16480" USING (true);
CREATE POLICY sessions_select_authenticated ON public.sessions FOR SELECT TO "16481" USING (true);
CREATE POLICY sessions_select_authenticator ON public.sessions FOR SELECT TO "16483" USING (true);
CREATE POLICY sessions_select_dashboard_user ON public.sessions FOR SELECT TO "16551" USING (true);
CREATE POLICY sessions_select_public ON public.sessions FOR SELECT TO "0" USING (true);
CREATE POLICY swap_requests_insert_owner ON public.swap_requests FOR INSERT TO "0" WITH CHECK ((auth.uid() = requested_by));
CREATE POLICY swap_requests_select_owner_or_admin ON public.swap_requests FOR SELECT TO "0" USING (((auth.uid() = requested_by) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::user_role, 'coordinator'::user_role])))))));
CREATE POLICY sync_auth_user_audit_insert ON public.sync_auth_user_audit FOR INSERT TO "0" WITH CHECK ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY sync_auth_user_audit_select ON public.sync_auth_user_audit FOR SELECT TO "0" USING ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY sync_auth_user_errors_insert ON public.sync_auth_user_errors FOR INSERT TO "0" WITH CHECK ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY sync_auth_user_errors_select ON public.sync_auth_user_errors FOR SELECT TO "0" USING ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY sync_auth_user_errors_archive_insert ON public.sync_auth_user_errors_archive FOR INSERT TO "0" WITH CHECK ((( SELECT auth.role() AS role) = 'admin'::text));
CREATE POLICY sync_auth_user_errors_archive_select ON public.sync_auth_user_errors_archive FOR SELECT TO "0" USING ((( SELECT auth.role() AS role) = 'admin'::text));