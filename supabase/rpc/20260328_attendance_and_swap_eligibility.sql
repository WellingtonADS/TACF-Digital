-- Regras de negocio para operacao admin/user sem update/insert critico direto no frontend.

create or replace function public.set_booking_attendance(
  p_booking_id uuid,
  p_attendance_confirmed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
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

  update public.bookings b
  set attendance_confirmed = p_attendance_confirmed,
      updated_at = now()
  where b.id = p_booking_id;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'booking',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('attendance_confirmed=%s; booking_id=%s', p_attendance_confirmed, p_booking_id)
  );
end;
$$;

create or replace function public.create_swap_request_if_eligible(
  p_booking_id uuid,
  p_requested_by uuid,
  p_new_session_id uuid,
  p_reason_text text,
  p_new_date text default null,
  p_attachment_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_request_id uuid;
  v_attendance_confirmed boolean;
  v_result_details jsonb;
  v_result_text text;
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

  if v_role is null then
    raise exception 'forbidden';
  end if;

  if p_requested_by <> v_uid and v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  if coalesce(trim(p_reason_text), '') = '' then
    raise exception 'justificativa obrigatoria';
  end if;

  if p_new_session_id is null then
    raise exception 'nova sessao obrigatoria';
  end if;

  perform 1
  from public.sessions s
  where s.id = p_new_session_id;

  if not found then
    raise exception 'nova sessao nao encontrada';
  end if;

  select b.attendance_confirmed, b.result_details
    into v_attendance_confirmed, v_result_details
  from public.bookings b
  where b.id = p_booking_id
    and b.user_id = p_requested_by
  for update;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;

  v_result_text := lower(coalesce(v_result_details #>> '{}', ''));

  if not (
    v_result_text = 'inapto'
    or v_attendance_confirmed is false
  ) then
    raise exception 'reagendamento disponivel apenas para inapto ou falta';
  end if;

  if exists (
    select 1
    from public.swap_requests sr
    where sr.booking_id = p_booking_id
      and sr.status = 'solicitado'
  ) then
    raise exception 'ja existe solicitacao pendente para este agendamento';
  end if;

  insert into public.swap_requests (
    booking_id,
    requested_by,
    new_session_id,
    reason
  ) values (
    p_booking_id,
    p_requested_by,
    p_new_session_id,
    json_build_object(
      'text', p_reason_text,
      'new_date', p_new_date,
      'attachment_url', p_attachment_url
    )::text
  )
  returning id into v_request_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'create',
    'swap_request',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'swap_request_id=%s; booking_id=%s; requested_by=%s; new_session_id=%s; eligibility_result=%s; attendance_confirmed=%s',
      v_request_id,
      p_booking_id,
      p_requested_by,
      p_new_session_id,
      coalesce(v_result_text, ''),
      coalesce(v_attendance_confirmed::text, 'null')
    )
  );

  return v_request_id;
end;
$$;
