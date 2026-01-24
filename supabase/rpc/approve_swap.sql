-- ============================================================================
-- RPC: approve_swap(request_id uuid, admin_id uuid)
-- Atomically approves a swap: moves booking to new session if capacity allows
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_swap(p_request_id uuid, p_admin_id uuid)
RETURNS TABLE(success boolean, error text) AS $$
DECLARE
  v_request RECORD;
  v_max integer;
  v_count integer;
BEGIN
  SELECT * INTO v_request FROM public.swap_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'request not found';
    RETURN;
  END IF;

  -- Load session capacity for new session and lock
  SELECT max_capacity INTO v_max FROM public.sessions WHERE id = v_request.new_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'new session not found';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.bookings WHERE session_id = v_request.new_session_id AND status = 'confirmed';
  IF v_count >= v_max THEN
    RETURN QUERY SELECT false, 'new session full';
    RETURN;
  END IF;

  -- Update booking to new session
  UPDATE public.bookings
  SET session_id = v_request.new_session_id, status = 'confirmed', updated_at = NOW()
  WHERE id = v_request.booking_id;

  -- Update swap request as processed
  UPDATE public.swap_requests
  SET status = 'approved', processed_by = p_admin_id, processed_at = NOW(), updated_at = NOW()
  WHERE id = p_request_id;

  RETURN QUERY SELECT true::boolean, NULL::text;

EXCEPTION WHEN others THEN
  RETURN QUERY SELECT false::boolean, SQLERRM::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
