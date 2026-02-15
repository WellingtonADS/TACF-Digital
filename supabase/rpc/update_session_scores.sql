-- RPC: update_session_scores
-- Confirms attendance for a user/session booking (admin only)

CREATE OR REPLACE FUNCTION public.update_session_scores(
  p_session_id UUID,
  p_user_id UUID,
  p_attendance_confirmed BOOLEAN
)
RETURNS TABLE (success BOOLEAN, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'not_authorized';
    RETURN;
  END IF;

  UPDATE public.bookings
    SET attendance_confirmed = p_attendance_confirmed
  WHERE session_id = p_session_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'booking_not_found';
    RETURN;
  END IF;

  INSERT INTO public.audit_logs (action, entity, user_id, user_name, details)
  SELECT
    'update',
    'booking',
    auth.uid(),
    p.full_name,
    format(
      'attendance_confirmed=%s; session_id=%s; user_id=%s',
      p_attendance_confirmed,
      p_session_id,
      p_user_id
    )
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN QUERY SELECT true, NULL;
END;
$$;
