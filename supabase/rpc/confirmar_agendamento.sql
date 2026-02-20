-- Wrapper RPC: confirmar_agendamento(p_user_id uuid, p_session_id uuid)
-- Calls book_session and, on success, generates an order number (YYYY-S-0001)

CREATE OR REPLACE FUNCTION public.confirmar_agendamento(p_user_id uuid, p_session_id uuid)
RETURNS TABLE(success boolean, booking_id uuid, error text, order_number text) AS $$
DECLARE
  r RECORD;
  v_order text;
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_semester TEXT;
BEGIN
  -- Call lower-level book_session which creates the booking and returns booking_id
  PERFORM 1; -- placeholder to keep structure

  BEGIN
    SELECT * FROM public.book_session(p_user_id, p_session_id) INTO r;
  EXCEPTION WHEN others THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, SQLERRM::text, NULL::text;
    RETURN;
  END;

  IF r.success IS NOT TRUE OR r.booking_id IS NULL THEN
    RETURN QUERY SELECT r.success::boolean, r.booking_id::uuid, r.error::text, NULL::text;
    RETURN;
  END IF;

  -- Read the semester stored in the booking (set by book_session via calendar/session date)
  SELECT semester::text INTO v_semester FROM public.bookings WHERE id = r.booking_id;
  IF v_semester IS NULL THEN
    RETURN QUERY SELECT false::boolean, r.booking_id::uuid, 'booking semester missing'::text, NULL::text;
    RETURN;
  END IF;

  -- Generate next order number (safe with row locking)
  v_order := public.fn_next_order_number(v_year, v_semester);

  -- Update booking with order number
  UPDATE public.bookings SET order_number = v_order WHERE id = r.booking_id;

  RETURN QUERY SELECT true::boolean, r.booking_id::uuid, NULL::text, v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: ensure ownership/permissions if deploying to Supabase (review SECURITY DEFINER usage).