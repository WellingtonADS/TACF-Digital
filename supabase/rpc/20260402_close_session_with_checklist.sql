-- Gate operacional para encerramento formal de sessao.
-- A validacao e feita no banco; frontend apenas consome checklist e aciona fechamento.

create or replace function public.close_session_with_checklist(
  p_session_id uuid,
  p_apply boolean default false
)
returns table(
  success boolean,
  error text,
  checklist jsonb,
  session_status public.session_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_session_status public.session_status;
  v_bookings_total integer := 0;
  v_results_pending integer := 0;
  v_pending_swap_requests integer := 0;
  v_can_close boolean := false;
  v_checklist jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role, p.full_name
    into v_role, v_user_name
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  select s.status
    into v_session_status
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    return query
    select
      false,
      'sessao nao encontrada'::text,
      jsonb_build_object(
        'bookings_total', 0,
        'attendance_treated_count', 0,
        'results_pending', 0,
        'pending_swap_requests', 0,
        'can_close', false,
        'already_completed', false
      ),
      null::public.session_status;
    return;
  end if;

  select
    count(*)::integer,
    count(*) filter (where b.result_details is null)::integer
    into v_bookings_total, v_results_pending
  from public.bookings b
  where b.session_id = p_session_id
    and b.status <> 'cancelado';

  select count(*)::integer
    into v_pending_swap_requests
  from public.swap_requests sr
  join public.bookings b on b.id = sr.booking_id
  where b.session_id = p_session_id
    and sr.status = 'solicitado';

  v_can_close :=
    v_bookings_total > 0
    and v_pending_swap_requests = 0;

  v_checklist := jsonb_build_object(
    'bookings_total', v_bookings_total,
    'attendance_treated_count', v_bookings_total,
    'results_pending', v_results_pending,
    'pending_swap_requests', v_pending_swap_requests,
    'can_close', v_can_close,
    'already_completed', v_session_status = 'completed'
  );

  if v_session_status = 'completed' then
    return query
    select true, null::text, v_checklist, v_session_status;
    return;
  end if;

  if not p_apply then
    return query
    select
      v_can_close,
      case when v_can_close then null::text else 'checklist incompleto para encerramento'::text end,
      v_checklist,
      v_session_status;
    return;
  end if;

  if not v_can_close then
    return query
    select false, 'checklist incompleto para encerramento'::text, v_checklist, v_session_status;
    return;
  end if;

  if v_results_pending > 0 then
    update public.bookings b
    set result_details = jsonb_build_object(
          'result_status', 'inapto',
          'result', 'inapto',
          'auto_assigned', true,
          'notes', 'Resultado definido no encerramento da sessao por ausencia de lancamento.',
          'updated_at', now()
        ),
        updated_at = now()
    where b.session_id = p_session_id
      and b.status <> 'cancelado'
      and b.result_details is null;
  end if;

  update public.sessions s
  set status = 'completed',
      updated_at = now()
  where s.id = p_session_id
  returning s.status into v_session_status;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'session_id=%s; status=completed; bookings_total=%s; results_pending=%s; pending_swap_requests=%s',
      p_session_id,
      v_bookings_total,
      v_results_pending,
      v_pending_swap_requests
    )
  );

  return query
  select true, null::text, v_checklist, v_session_status;
end;
$$;
