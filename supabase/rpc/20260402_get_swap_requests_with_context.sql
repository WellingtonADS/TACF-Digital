/**
 * @file get_swap_requests_with_context.sql
 * @description Consolidada RPC que retorna todas as swap requests enriquecidas com contexto
 *              de booking, sessões (original e nova), e perfis de usuários.
 * @author Sprint 2: Administração Consolidada
 * @date 2026-04-02
 * 
 * Substitui 4 queries sequenciais do frontend com 1 RPC transacional.
 * Elimina N+1 pattern em useReschedulingManagement.
 */

CREATE OR REPLACE FUNCTION get_swap_requests_with_context()
RETURNS TABLE (
  id uuid,
  booking_id uuid,
  status swap_status,
  reason text,
  created_at timestamptz,
  processed_at timestamptz,
  processed_by uuid,
  -- Booking info
  user_id uuid,
  original_session_id uuid,
  -- Original session info
  original_date date,
  original_period session_period,
  -- New session info
  new_session_id uuid,
  new_date date,
  new_period session_period,
  -- User profile info
  full_name text,
  war_name text,
  saram text,
  rank text,
  email text
) LANGUAGE sql STABLE SECURITY DEFINER AS $function$
SELECT
  sr.id,
  sr.booking_id,
  sr.status,
  sr.reason,
  sr.created_at,
  sr.processed_at,
  sr.processed_by,
  -- Booking references
  b.user_id,
  b.session_id as original_session_id,
  -- Original session details
  s1.date as original_date,
  s1.period as original_period,
  -- New session details
  sr.new_session_id,
  s2.date as new_date,
  s2.period as new_period,
  -- Profile details
  p.full_name,
  p.war_name,
  p.saram,
  p.rank,
  p.email
FROM swap_requests sr
LEFT JOIN bookings b ON sr.booking_id = b.id
LEFT JOIN sessions s1 ON b.session_id = s1.id
LEFT JOIN sessions s2 ON sr.new_session_id = s2.id
LEFT JOIN profiles p ON b.user_id = p.id
ORDER BY sr.created_at DESC;
$function$;

COMMENT ON FUNCTION get_swap_requests_with_context() IS
'Retorna todas as swap requests com contexto consolidado. '
'MOTIVACAO: Eliminar 4 queries sequenciais (N+1 pattern) em useReschedulingManagement. '
'RETURN: Tabela com swap_requests, booking, sessões (original+nova) e profile enriquecidos. '
'PERFORMANCE: Single-pass join vs. 4 sequential queries (backend). '
'SECURITY: Definer owner (admin) executa query; RLS configurada em nivel de table.';

revoke all on function get_swap_requests_with_context() from public;
grant execute on function get_swap_requests_with_context() to authenticated;
