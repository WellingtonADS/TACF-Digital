create or replace function public.get_user_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_next_booking record;
  v_has_pending_swap boolean := false;
  v_latest_swap_status public.swap_status;
  v_payload jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return jsonb_build_object(
      'bookings_count', 0,
      'results_count', 0,
      'next_session', null,
      'next_session_booking_id', null,
      'has_pending_swap', false,
      'latest_order_number', null,
      'current_operational_status', 'sem_agendamento_ativo',
      'latest_swap_status', null
    );
  end if;

  select
    b.id as booking_id,
    b.order_number,
    s.id as session_id,
    s.date,
    s.period,
    s.max_capacity
  into v_next_booking
  from public.bookings b
  join public.sessions s
    on s.id = b.session_id
  where b.user_id = v_uid
    and b.status = 'agendado'
  order by s.date asc, b.created_at desc
  limit 1;

  select exists (
    select 1
    from public.swap_requests sr
    join public.bookings b
      on b.id = sr.booking_id
    where b.user_id = v_uid
      and sr.status = 'solicitado'
  ) into v_has_pending_swap;

  select sr.status
    into v_latest_swap_status
  from public.swap_requests sr
  join public.bookings b
    on b.id = sr.booking_id
  where b.user_id = v_uid
  order by sr.created_at desc
  limit 1;

  v_payload := jsonb_build_object(
    'bookings_count',
    (
      select count(*)::integer
      from public.bookings b
      where b.user_id = v_uid
        and b.status = 'agendado'
    ),
    'results_count',
    (
      select count(*)::integer
      from public.bookings b
      where b.user_id = v_uid
        and b.result_details is not null
    ),
    'next_session',
    case
      when v_next_booking.booking_id is null then null
      else jsonb_build_object(
        'session_id', v_next_booking.session_id,
        'date', v_next_booking.date,
        'period', v_next_booking.period,
        'max_capacity', v_next_booking.max_capacity
      )
    end,
    'next_session_booking_id', v_next_booking.booking_id,
    'has_pending_swap', v_has_pending_swap,
    'latest_order_number', v_next_booking.order_number,
    'current_operational_status',
    case
      when v_has_pending_swap then 'reagendamento_solicitado'
      when v_next_booking.booking_id is not null then 'agendado'
      else 'sem_agendamento_ativo'
    end,
    'latest_swap_status', v_latest_swap_status
  );

  return v_payload;
end;
$$;

revoke all on function public.get_user_dashboard_summary() from public;
grant execute on function public.get_user_dashboard_summary() to authenticated;
