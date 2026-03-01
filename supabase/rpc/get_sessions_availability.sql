-- RPC: get_sessions_availability(p_start date, p_end date)
-- Returns per-session occupancy counts without exposing PII

-- RPC: get_sessions_availability(p_start date, p_end date)
-- Returns per-session occupancy counts without exposing PII
-- DROP necessário para permitir alteração do tipo de retorno

DROP FUNCTION IF EXISTS public.get_sessions_availability(date, date);

CREATE FUNCTION public.get_sessions_availability(p_start date, p_end date)
RETURNS TABLE(
  session_id uuid,
  date date,
  period text,
  max_capacity integer,
  occupied_count bigint,
  available_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.date,
    s.period::text,
    s.max_capacity,
    COUNT(b.id) AS occupied_count,
    (s.max_capacity - COUNT(b.id)) AS available_count
  FROM public.sessions s
  LEFT JOIN public.bookings b
    ON b.session_id = s.id AND b.status = 'confirmed'
  WHERE s.date >= p_start AND s.date <= p_end
  GROUP BY s.id, s.date, s.period, s.max_capacity
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.get_sessions_availability(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sessions_availability(date, date) TO anon, authenticated;

-- NOTE: This function runs with SECURITY DEFINER and therefore bypasses RLS.
-- Ensure the function owner is a trusted role (see `supabase/policies/rls.sql`).
