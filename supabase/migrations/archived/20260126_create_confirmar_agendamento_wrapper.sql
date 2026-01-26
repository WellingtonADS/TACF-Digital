-- Migration: Create wrapper RPC 'confirmar_agendamento' that delegates to public.book_session
BEGIN;

CREATE OR REPLACE FUNCTION public.confirmar_agendamento(p_user_id uuid, p_session_id uuid)
RETURNS TABLE(success boolean, booking_id uuid, error text) AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.book_session(p_user_id, p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
