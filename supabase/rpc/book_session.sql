-- ============================================================================
-- RPC: book_session(user_id uuid, session_id uuid)
-- Ensures atomic booking with row locking to prevent race conditions
-- Returns: success boolean, booking_id uuid, error text
-- ============================================================================

CREATE OR REPLACE FUNCTION public.book_session(p_user_id uuid, p_session_id uuid)
RETURNS TABLE(success boolean, booking_id uuid, error text) AS $$
DECLARE
  v_max integer;
  v_count integer;
  v_booking_id uuid;
  v_semester semester_type;
  v_existing_semester_bookings integer;
BEGIN
  -- Lock the session row to serialize concurrent checks
  SELECT max_capacity INTO v_max
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'session not found'::text;
    RETURN;
  END IF;

  -- Verify caller is booking for themselves
  IF auth.uid() IS NULL OR auth.uid()::uuid <> p_user_id THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'unauthorized: user mismatch'::text;
    RETURN;
  END IF;

  -- Determine user's role/active status and semester
  DECLARE v_role user_role;
  DECLARE v_active boolean;

  SELECT role, active, semester INTO v_role, v_active, v_semester FROM public.profiles WHERE id = p_user_id;

  IF v_active IS FALSE THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'profile inactive'::text;
    RETURN;
  END IF;

  -- Admins and coordinators are not allowed to book
  IF v_role IN ('admin', 'coordinator') THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'role not allowed to book'::text;
    RETURN;
  END IF;

  IF v_semester IS NULL THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'user semester unknown'::text;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_existing_semester_bookings
  FROM public.bookings b
  WHERE b.user_id = p_user_id AND b.status = 'confirmed' AND b.semester = v_semester;

  IF v_existing_semester_bookings > 0 THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'user already has booking this semester'::text;
    RETURN;
  END IF;

  -- Count confirmed bookings for the session
  SELECT COUNT(*) INTO v_count
  FROM public.bookings
  WHERE session_id = p_session_id AND status = 'confirmed';

  IF v_count >= v_max THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'session full'::text;
    RETURN;
  END IF;

  -- Create booking; set semester accordingly
  INSERT INTO public.bookings (user_id, session_id, status, semester)
  VALUES (p_user_id, p_session_id, 'confirmed', v_semester)
  RETURNING id INTO v_booking_id;

  RETURN QUERY SELECT true::boolean, v_booking_id, NULL::text;

EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'duplicate booking'::text;
  WHEN others THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, SQLERRM::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security note:
-- Run: ALTER FUNCTION public.book_session(uuid, uuid) OWNER TO postgres; (or an admin role) in Supabase SQL Editor
-- This ensures the function can bypass RLS where appropriate but still respects logic. Review security accordingly.
