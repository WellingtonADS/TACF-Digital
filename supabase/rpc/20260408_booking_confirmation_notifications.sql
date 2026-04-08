create or replace function public.queue_booking_email_notifications(
  p_booking_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
  v_reminder_date date;
  v_reminder_schedule timestamptz;
begin
  select
    b.id as booking_id,
    b.user_id,
    b.order_number,
    b.test_date,
    s.date as session_date,
    s.period,
    l.name as location_name,
    l.address as location_address,
    coalesce(
      nullif(trim(p.full_name), ''),
      nullif(trim(p.war_name), ''),
      'Militar'
    ) as recipient_name,
    coalesce(
      nullif(trim(p.email), ''),
      nullif(trim(au.email), '')
    ) as recipient_email
  into v_booking
  from public.bookings b
  join public.sessions s
    on s.id = b.session_id
  left join public.locations l
    on l.id = s.location_id
  left join public.profiles p
    on p.id = b.user_id
  left join auth.users au
    on au.id = b.user_id
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  if v_booking.recipient_email is null then
    return;
  end if;

  insert into public.booking_email_notifications (
    booking_id,
    recipient_user_id,
    recipient_email,
    notification_type,
    scheduled_for,
    payload
  ) values (
    v_booking.booking_id,
    v_booking.user_id,
    v_booking.recipient_email,
    'booking_confirmation',
    now(),
    jsonb_build_object(
      'recipient_name', v_booking.recipient_name,
      'session_date', v_booking.session_date,
      'session_period', v_booking.period,
      'location_name', v_booking.location_name,
      'location_address', v_booking.location_address,
      'order_number', v_booking.order_number
    )
  )
  on conflict (booking_id, notification_type) do update
  set recipient_user_id = excluded.recipient_user_id,
      recipient_email = excluded.recipient_email,
      scheduled_for = excluded.scheduled_for,
      payload = excluded.payload,
      status = case
        when public.booking_email_notifications.sent_at is null then 'pending'
        else public.booking_email_notifications.status
      end,
      last_error = null;

  v_reminder_date := v_booking.session_date - 1;

  if v_reminder_date >= current_date then
    v_reminder_schedule := make_timestamptz(
      extract(year from v_reminder_date)::integer,
      extract(month from v_reminder_date)::integer,
      extract(day from v_reminder_date)::integer,
      9,
      0,
      0,
      'America/Manaus'
    );

    if v_reminder_schedule < now() then
      v_reminder_schedule := now();
    end if;

    insert into public.booking_email_notifications (
      booking_id,
      recipient_user_id,
      recipient_email,
      notification_type,
      scheduled_for,
      payload
    ) values (
      v_booking.booking_id,
      v_booking.user_id,
      v_booking.recipient_email,
      'booking_reminder',
      v_reminder_schedule,
      jsonb_build_object(
        'recipient_name', v_booking.recipient_name,
        'session_date', v_booking.session_date,
        'session_period', v_booking.period,
        'location_name', v_booking.location_name,
        'location_address', v_booking.location_address,
        'order_number', v_booking.order_number
      )
    )
    on conflict (booking_id, notification_type) do update
    set recipient_user_id = excluded.recipient_user_id,
        recipient_email = excluded.recipient_email,
        scheduled_for = excluded.scheduled_for,
        payload = excluded.payload,
        status = case
          when public.booking_email_notifications.sent_at is null then 'pending'
          else public.booking_email_notifications.status
        end,
        last_error = null;
  end if;
end;
$$;

create or replace function public.claim_booking_email_notifications(
  p_limit integer default 20,
  p_booking_id uuid default null,
  p_types text[] default null
)
returns table (
  notification_id uuid,
  booking_id uuid,
  recipient_user_id uuid,
  recipient_email text,
  notification_type text,
  scheduled_for timestamptz,
  payload jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select n.id
    from public.booking_email_notifications n
    where n.status = 'pending'
      and n.scheduled_for <= now()
      and (p_booking_id is null or n.booking_id = p_booking_id)
      and (p_types is null or n.notification_type = any(p_types))
    order by n.scheduled_for asc, n.created_at asc
    limit greatest(coalesce(p_limit, 20), 1)
    for update skip locked
  ),
  claimed as (
    update public.booking_email_notifications n
    set status = 'processing',
        updated_at = now()
    from due
    where n.id = due.id
    returning
      n.id,
      n.booking_id,
      n.recipient_user_id,
      n.recipient_email,
      n.notification_type,
      n.scheduled_for,
      n.payload
  )
  select
    c.id as notification_id,
    c.booking_id,
    c.recipient_user_id,
    c.recipient_email,
    c.notification_type,
    c.scheduled_for,
    c.payload
  from claimed c;
end;
$$;

create or replace function public.confirmar_agendamento(
  p_user_id uuid,
  p_session_id uuid
)
returns table (
  success boolean,
  booking_id uuid,
  error text,
  order_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_date date;
  v_max_capacity integer;
  v_current_capacity integer;
  v_session_status public.session_status;
  v_semester public.semester_type;
  v_year integer;
  v_next_order integer;
  v_order_number text;
  v_new_booking_id uuid;
  v_profile_active boolean;
  v_role public.user_role;
  v_semester_start date;
  v_semester_end date;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return query
    select false, null::uuid, 'unauthorized: user mismatch'::text, null::text;
    return;
  end if;

  select
    s.date,
    s.max_capacity,
    coalesce(s.capacity, 0),
    s.status
  into
    v_session_date,
    v_max_capacity,
    v_current_capacity,
    v_session_status
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    return query
    select false, null::uuid, 'session not found'::text, null::text;
    return;
  end if;

  if v_session_date is null then
    return query
    select false, null::uuid, 'session date unknown'::text, null::text;
    return;
  end if;

  if v_session_status <> 'open' then
    return query
    select false, null::uuid, 'session not open'::text, null::text;
    return;
  end if;

  if v_current_capacity >= v_max_capacity then
    return query
    select false, null::uuid, 'session full'::text, null::text;
    return;
  end if;

  select p.active, p.role
  into v_profile_active, v_role
  from public.profiles p
  where p.id = p_user_id;

  if v_profile_active is not true then
    return query
    select false, null::uuid, 'profile inactive'::text, null::text;
    return;
  end if;

  if v_role in ('admin', 'coordinator') then
    return query
    select false, null::uuid, 'role not allowed to book'::text, null::text;
    return;
  end if;

  v_year := extract(year from v_session_date);
  v_semester := case
    when extract(month from v_session_date) <= 6 then '1'::public.semester_type
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
    where b.user_id = p_user_id
      and b.status = 'agendado'
      and b.test_date between v_semester_start and v_semester_end
  ) then
    return query
    select false, null::uuid, 'user already has booking this semester'::text, null::text;
    return;
  end if;

  insert into public.order_numbers (year, semester, last)
  values (v_year, v_semester::text, 1)
  on conflict (year, semester)
  do update set last = public.order_numbers.last + 1
  returning last into v_next_order;

  v_order_number :=
    v_year::text || '-' || v_semester::text || '-' || lpad(v_next_order::text, 4, '0');

  insert into public.bookings (
    user_id,
    session_id,
    status,
    semester,
    order_number,
    test_date
  ) values (
    p_user_id,
    p_session_id,
    'agendado',
    v_semester,
    v_order_number,
    v_session_date
  )
  returning id into v_new_booking_id;

  perform public.queue_booking_email_notifications(v_new_booking_id);

  return query
  select true, v_new_booking_id, null::text, v_order_number;
exception
  when unique_violation then
    return query
    select false, null::uuid, 'duplicate booking'::text, null::text;
  when others then
    return query
    select false, null::uuid, sqlerrm::text, null::text;
end;
$$;
