-- RPC: get_sessions_availability(p_start date, p_end date)
-- Returns per-session occupancy counts without exposing PII

CREATE OR REPLACE FUNCTION public.get_sessions_availability(p_start date, p_end date)
RETURNS TABLE(
  session_id uuid,
  date date,
  period text,
  max_capacity integer,
  occupied_count integer,
  available_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.date,
    s.period::text,
    s.max_capacity,
    COALESCE(COUNT(b.*), 0) AS occupied_count,
    s.max_capacity - COALESCE(COUNT(b.*), 0) AS available_count
  FROM public.sessions s
  LEFT JOIN public.bookings b
    ON b.session_id = s.id AND b.status = 'confirmed'
  WHERE s.date >= p_start AND s.date <= p_end
  GROUP BY s.id, s.date, s.period, s.max_capacity
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- NOTE: This function runs with SECURITY DEFINER and therefore bypasses RLS.
-- Ensure the function owner is a trusted role (see `supabase/policies/rls.sql`).
