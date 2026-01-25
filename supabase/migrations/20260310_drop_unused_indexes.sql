-- Migration: drop indexes reported as unused by advisor
BEGIN;

DROP INDEX IF EXISTS public.idx_profiles_saram;
DROP INDEX IF EXISTS public.idx_bookings_user_semester;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_semester;
DROP INDEX IF EXISTS public.idx_sessions_date;
DROP INDEX IF EXISTS public.idx_sessions_status;
DROP INDEX IF EXISTS public.idx_sessions_date_period;
DROP INDEX IF EXISTS public.idx_bookings_status;
DROP INDEX IF EXISTS public.idx_swap_requests_booking_id;
DROP INDEX IF EXISTS public.idx_swap_requests_status;

COMMIT;
