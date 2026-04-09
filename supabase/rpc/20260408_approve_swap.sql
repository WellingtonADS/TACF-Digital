drop function if exists public.approve_swap(uuid, uuid);

create or replace function public.approve_swap(
  p_request_id uuid,
  p_admin_id uuid
)
returns table (
  success boolean,
  error text,
  original_booking_id uuid,
  new_booking_id uuid,
  new_session_id uuid,
  order_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_request public.swap_requests%rowtype;
  v_original_booking public.bookings%rowtype;
  v_target_session record;
  v_target_occupied_count integer := 0;
  v_year integer;
  v_semester public.semester_type;
  v_semester_start date;
  v_semester_end date;
  v_next_order integer;
  v_order_number text;
  v_new_booking_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  if p_admin_id is null or p_admin_id <> v_uid then
    raise exception 'forbidden';
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

  select *
    into v_request
  from public.swap_requests sr
  where sr.id = p_request_id
  for update;

  if not found then
    return query
    select
      false,
      'swap request not found'::text,
      null::uuid,
      null::uuid,
      null::uuid,
      null::text;
    return;
  end if;

  if v_request.status <> 'solicitado' then
    return query
    select
      false,
      'swap request already processed'::text,
      v_request.booking_id,
      null::uuid,
      v_request.new_session_id,
      null::text;
    return;
  end if;

  select *
    into v_original_booking
  from public.bookings b
  where b.id = v_request.booking_id
  for update;

  if not found then
    return query
    select
      false,
      'booking not found'::text,
      v_request.booking_id,
      null::uuid,
      v_request.new_session_id,
      null::text;
    return;
  end if;

  if v_original_booking.status <> 'agendado' then
    return query
    select
      false,
      'booking is not active anymore'::text,
      v_original_booking.id,
      null::uuid,
      v_request.new_session_id,
      null::text;
    return;
  end if;

  select
    s.id,
    s.date,
    s.status,
    s.max_capacity
    into v_target_session
  from public.sessions s
  where s.id = v_request.new_session_id
  for update;

  if not found then
    return query
    select
      false,
      'session not found'::text,
      v_original_booking.id,
      null::uuid,
      v_request.new_session_id,
      null::text;
    return;
  end if;

  if v_target_session.status <> 'open' then
    return query
    select
      false,
      'session not open'::text,
      v_original_booking.id,
      null::uuid,
      v_target_session.id,
      null::text;
    return;
  end if;

  select count(*)::integer
    into v_target_occupied_count
  from public.bookings b
  where b.session_id = v_target_session.id
    and b.status = 'agendado';

  if v_target_occupied_count >= coalesce(v_target_session.max_capacity, 0) then
    return query
    select
      false,
      'session full'::text,
      v_original_booking.id,
      null::uuid,
      v_target_session.id,
      null::text;
    return;
  end if;

  v_year := extract(year from v_target_session.date);
  v_semester := case
    when extract(month from v_target_session.date) <= 6 then '1'::public.semester_type
    else '2'::public.semester_type
  end;

  v_semester_start := case
    when v_semester = '1' then make_date(v_year, 1, 1)
    else make_date(v_year, 7, 1)
  end;

  v_semester_end := case
    when v_semester = '1' then make_date(v_year, 6, 30)
    else make_date(v_year, 12, 31)
  end;

  if exists (
    select 1
    from public.bookings b
    where b.user_id = v_original_booking.user_id
      and b.status = 'agendado'
      and b.id <> v_original_booking.id
      and b.test_date between v_semester_start and v_semester_end
  ) then
    return query
    select
      false,
      'user already has active booking this semester'::text,
      v_original_booking.id,
      null::uuid,
      v_target_session.id,
      null::text;
    return;
  end if;

  if public.user_has_semester_approved_result(
    v_original_booking.user_id,
    v_semester_start,
    v_semester_end,
    v_original_booking.id
  ) then
    return query
    select
      false,
      'user already approved this semester'::text,
      v_original_booking.id,
      null::uuid,
      v_target_session.id,
      null::text;
    return;
  end if;

  insert into public.order_numbers (year, semester, last)
  values (v_year, v_semester::text, 1)
  on conflict (year, semester)
  do update set last = public.order_numbers.last + 1
  returning last into v_next_order;

  v_order_number :=
    v_year::text || '-' || v_semester::text || '-' || lpad(v_next_order::text, 4, '0');

  update public.bookings
  set status = 'remarcado',
      updated_at = now()
  where id = v_original_booking.id;

  insert into public.bookings (
    user_id,
    session_id,
    status,
    semester,
    order_number,
    test_date,
    attendance_confirmed,
    score,
    result_details,
    metadata
  ) values (
    v_original_booking.user_id,
    v_target_session.id,
    'agendado',
    v_semester,
    v_order_number,
    v_target_session.date,
    false,
    null,
    null,
    v_original_booking.metadata
  )
  returning id into v_new_booking_id;

  update public.swap_requests
  set status = 'aprovado',
      processed_by = v_uid,
      processed_at = now(),
      updated_at = now()
  where id = v_request.id;

  insert into public.user_notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    message,
    metadata
  ) values (
    v_original_booking.user_id,
    v_uid,
    'swap_approved',
    'Reagendamento aprovado',
    'Seu reagendamento foi aprovado e um novo agendamento ativo foi criado.',
    jsonb_build_object(
      'swap_request_id', v_request.id,
      'original_booking_id', v_original_booking.id,
      'new_booking_id', v_new_booking_id,
      'new_session_id', v_target_session.id,
      'order_number', v_order_number
    )
  );

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'approve',
    'swap_request',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'swap_request_id=%s; original_booking_id=%s; new_booking_id=%s; new_session_id=%s; order_number=%s',
      v_request.id,
      v_original_booking.id,
      v_new_booking_id,
      v_target_session.id,
      v_order_number
    )
  );

  perform public.queue_booking_email_notifications(v_new_booking_id);

  return query
  select
    true,
    null::text,
    v_original_booking.id,
    v_new_booking_id,
    v_target_session.id,
    v_order_number;
exception
  when unique_violation then
    return query
    select
      false,
      'user already has active booking this semester'::text,
      null::uuid,
      null::uuid,
      null::uuid,
      null::text;
  when others then
    return query
    select
      false,
      sqlerrm::text,
      null::uuid,
      null::uuid,
      null::uuid,
      null::text;
end;
$$;

revoke all on function public.approve_swap(uuid, uuid) from public;
grant execute on function public.approve_swap(uuid, uuid) to authenticated;
