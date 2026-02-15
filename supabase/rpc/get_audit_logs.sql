-- RPC: get_audit_logs
-- Returns recent audit log entries (admin only)

CREATE OR REPLACE FUNCTION public.get_audit_logs()
RETURNS TABLE (
  id UUID,
  action TEXT,
  entity TEXT,
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMPTZ,
  details TEXT
)
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
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.action,
    l.entity,
    l.user_id,
    COALESCE(l.user_name, p.full_name),
    l.created_at,
    l.details
  FROM public.audit_logs l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  ORDER BY l.created_at DESC
  LIMIT 500;
END;
$$;
