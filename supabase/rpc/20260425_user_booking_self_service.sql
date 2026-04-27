create or replace function public.ensure_user_booking_change_allowed(
  p_booking_id uuid,
  p_user_id uuid
)
returns table (
  booking_id uuid,
  session_id uuid,
  session_date date,
  booking_status public.booking_status,
  session_status public.session_status
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.session_id,
    s.date,
    b.status,
    s.status
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.id = p_booking_id
    and b.user_id = p_user_id
  limit 1;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;
end;
$$;

create or replace function public.cancel_my_booking(
  p_booking_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_booking record;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select *
    into v_booking
  from public.ensure_user_booking_change_allowed(p_booking_id, v_uid);

  if v_booking.booking_status not in ('agendado', 'remarcado') then
    raise exception 'agendamento nao esta ativo';
  end if;

  if v_booking.session_status <> 'open' then
    raise exception 'sessao bloqueada para cancelamento';
  end if;

  if current_date > (v_booking.session_date - 2) then
    raise exception 'cancelamento disponivel ate 2 dias antes da sessao';
  end if;

  update public.bookings
  set status = 'cancelado',
      updated_at = now()
  where id = p_booking_id
    and user_id = v_uid;

  update public.swap_requests
  set status = 'cancelado',
      processed_at = now(),
      updated_at = now()
  where booking_id = p_booking_id
    and requested_by = v_uid
    and status = 'solicitado';

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  select
    'update',
    'booking',
    v_uid,
    coalesce(p.full_name, p.email, 'sistema'),
    format('booking_id=%s; self_cancel=true; session_id=%s', p_booking_id, v_booking.session_id)
  from public.profiles p
  where p.id = v_uid;
end;
$$;

drop function if exists public.create_swap_request_if_eligible(uuid, uuid, uuid, text, text, text);
drop function if exists public.create_swap_request_if_eligible(uuid, uuid, uuid, text, date, text);

create function public.create_swap_request_if_eligible(
  p_booking_id uuid,
  p_requested_by uuid,
  p_new_session_id uuid,
  p_reason_text text,
  p_new_date date default null,
  p_attachment_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_booking record;
  v_new_session_date date;
  v_new_session_status public.session_status;
  v_new_capacity integer;
  v_new_occupied integer;
  v_request_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  if p_requested_by is distinct from v_uid then
    raise exception 'usuario nao autorizado';
  end if;

  if nullif(trim(coalesce(p_reason_text, '')), '') is null then
    raise exception 'justificativa obrigatoria';
  end if;

  select *
    into v_booking
  from public.ensure_user_booking_change_allowed(p_booking_id, v_uid);

  if v_booking.booking_status not in ('agendado', 'remarcado') then
    raise exception 'agendamento nao esta ativo';
  end if;

  if v_booking.session_status <> 'open' then
    raise exception 'sessao bloqueada para reagendamento';
  end if;

  if current_date > (v_booking.session_date - 2) then
    raise exception 'reagendamento disponivel ate 2 dias antes da sessao';
  end if;

  if p_new_session_id = v_booking.session_id then
    raise exception 'nova sessao deve ser diferente da atual';
  end if;

  if exists (
    select 1
    from public.swap_requests sr
    where sr.booking_id = p_booking_id
      and sr.requested_by = v_uid
      and sr.status = 'solicitado'
  ) then
    raise exception 'ja existe solicitacao pendente';
  end if;

  select s.date, s.status, s.max_capacity
    into v_new_session_date, v_new_session_status, v_new_capacity
  from public.sessions s
  where s.id = p_new_session_id;

  if v_new_session_date is null then
    raise exception 'nova sessao nao encontrada';
  end if;

  if v_new_session_status <> 'open' then
    raise exception 'nova sessao indisponivel';
  end if;

  if p_new_date is not null and p_new_date <> v_new_session_date then
    raise exception 'data da nova sessao divergente';
  end if;

  if current_date > (v_new_session_date - 2) then
    raise exception 'nova sessao exige antecedencia minima de 2 dias';
  end if;

  select count(*)::integer
    into v_new_occupied
  from public.bookings b
  where b.session_id = p_new_session_id
    and b.status <> 'cancelado';

  if v_new_occupied >= coalesce(v_new_capacity, 0) then
    raise exception 'nova sessao sem vagas';
  end if;

  insert into public.swap_requests (
    booking_id,
    requested_by,
    new_session_id,
    reason,
    status
  )
  values (
    p_booking_id,
    v_uid,
    p_new_session_id,
    jsonb_build_object(
      'text', trim(p_reason_text),
      'new_date', v_new_session_date,
      'attachment_url', p_attachment_url
    )::text,
    'solicitado'
  )
  returning id into v_request_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  select
    'create',
    'swap_request',
    v_uid,
    coalesce(p.full_name, p.email, 'sistema'),
    format(
      'booking_id=%s; from_session_id=%s; new_session_id=%s',
      p_booking_id,
      v_booking.session_id,
      p_new_session_id
    )
  from public.profiles p
  where p.id = v_uid;

  return v_request_id;
end;
$$;

drop function if exists public.approve_swap(uuid, uuid);

create function public.approve_swap(
  p_request_id uuid,
  p_admin_id uuid
)
returns table (success boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_request record;
  v_new_session_date date;
  v_new_session_status public.session_status;
  v_new_capacity integer;
  v_new_occupied integer;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return query select false, 'nao autenticado'::text;
    return;
  end if;

  if p_admin_id is distinct from v_uid then
    return query select false, 'usuario nao autorizado'::text;
    return;
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is distinct from 'admin' then
    return query select false, 'forbidden'::text;
    return;
  end if;

  select
    sr.id,
    sr.booking_id,
    sr.new_session_id,
    sr.status,
    b.user_id,
    b.status as booking_status
    into v_request
  from public.swap_requests sr
  join public.bookings b on b.id = sr.booking_id
  where sr.id = p_request_id
  for update;

  if not found then
    return query select false, 'solicitacao nao encontrada'::text;
    return;
  end if;

  if v_request.status <> 'solicitado' then
    return query select false, 'solicitacao ja tratada'::text;
    return;
  end if;

  if v_request.booking_status not in ('agendado', 'remarcado') then
    return query select false, 'agendamento nao esta ativo'::text;
    return;
  end if;

  select s.date, s.status, s.max_capacity
    into v_new_session_date, v_new_session_status, v_new_capacity
  from public.sessions s
  where s.id = v_request.new_session_id;

  if v_new_session_date is null then
    return query select false, 'nova sessao nao encontrada'::text;
    return;
  end if;

  if v_new_session_status <> 'open' then
    return query select false, 'nova sessao indisponivel'::text;
    return;
  end if;

  select count(*)::integer
    into v_new_occupied
  from public.bookings b
  where b.session_id = v_request.new_session_id
    and b.status <> 'cancelado'
    and b.id <> v_request.booking_id;

  if v_new_occupied >= coalesce(v_new_capacity, 0) then
    return query select false, 'nova sessao sem vagas'::text;
    return;
  end if;

  update public.bookings
  set session_id = v_request.new_session_id,
      status = 'remarcado',
      updated_at = now()
  where id = v_request.booking_id;

  update public.swap_requests
  set status = 'aprovado',
      processed_by = v_uid,
      processed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  select
    'update',
    'swap_request',
    v_uid,
    coalesce(p.full_name, p.email, 'sistema'),
    format(
      'swap_request_id=%s; booking_id=%s; approved=true; new_session_id=%s',
      p_request_id,
      v_request.booking_id,
      v_request.new_session_id
    )
  from public.profiles p
  where p.id = v_uid;

  return query select true, null::text;
end;
$$;
