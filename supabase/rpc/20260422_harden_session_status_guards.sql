create or replace function public.set_booking_result(
  p_booking_id uuid,
  p_result text default null,
  p_result_payload jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_result_status text;
  v_payload jsonb;
  v_session_status text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  select s.status
    into v_session_status
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.id = p_booking_id
  limit 1;

  if v_session_status is null then
    raise exception 'agendamento nao encontrado';
  end if;

  if v_session_status <> 'open' then
    raise exception 'sessao bloqueada para lancamento';
  end if;

  v_result_status := lower(coalesce(p_result_payload ->> 'result_status', p_result));

  if v_result_status not in ('apto', 'inapto', 'pendente') then
    raise exception 'resultado invalido';
  end if;

  v_payload := coalesce(p_result_payload, '{}'::jsonb);
  v_payload := jsonb_strip_nulls(
    v_payload
    || jsonb_build_object(
      'result_status', v_result_status,
      'result', v_result_status,
      'updated_at', now()
    )
  );

  update public.bookings
  set result_details = v_payload,
      updated_at = now()
  where id = p_booking_id;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;
end;
$$;

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
  v_session_status text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  select s.status
    into v_session_status
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.id = p_booking_id
  limit 1;

  if v_session_status is null then
    raise exception 'agendamento nao encontrado';
  end if;

  if v_session_status <> 'open' then
    raise exception 'sessao bloqueada para lancamento';
  end if;

  update public.bookings
  set attendance_confirmed = p_attendance_confirmed,
      updated_at = now()
  where id = p_booking_id;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;
end;
$$;
