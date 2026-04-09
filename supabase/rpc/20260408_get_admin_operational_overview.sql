create or replace function public.get_admin_operational_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
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

  return jsonb_build_object(
    'open_full_sessions',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'session_id', summary.session_id,
          'date', summary.date,
          'period', summary.period,
          'max_capacity', summary.max_capacity,
          'occupied_count', summary.occupied_count
        )
        order by summary.date asc, summary.period asc
      )
      from (
        select
          s.id as session_id,
          s.date,
          s.period,
          s.max_capacity,
          count(b.id)::integer as occupied_count
        from public.sessions s
        left join public.bookings b
          on b.session_id = s.id
         and b.status = 'agendado'
        where s.status = 'open'
        group by s.id, s.date, s.period, s.max_capacity
        having count(b.id) >= s.max_capacity
      ) summary
    ), '[]'::jsonb),
    'ready_to_close_sessions',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'session_id', summary.session_id,
          'date', summary.date,
          'period', summary.period,
          'bookings_total', summary.bookings_total,
          'results_pending', summary.results_pending,
          'pending_swap_requests', summary.pending_swap_requests
        )
        order by summary.date asc, summary.period asc
      )
      from (
        select
          s.id as session_id,
          s.date,
          s.period,
          count(b.id)::integer as bookings_total,
          count(b.id) filter (where b.result_details is null)::integer as results_pending,
          (
            select count(*)::integer
            from public.swap_requests sr
            join public.bookings sb on sb.id = sr.booking_id
            where sb.session_id = s.id
              and sr.status = 'solicitado'
          ) as pending_swap_requests
        from public.sessions s
        left join public.bookings b
          on b.session_id = s.id
         and b.status <> 'cancelado'
        where s.status <> 'completed'
          and s.date <= current_date
        group by s.id, s.date, s.period
        having count(b.id) > 0
           and count(b.id) filter (where b.result_details is null) = 0
           and (
             select count(*)::integer
             from public.swap_requests sr
             join public.bookings sb on sb.id = sr.booking_id
             where sb.session_id = s.id
               and sr.status = 'solicitado'
           ) = 0
      ) summary
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_admin_operational_overview() from public;
grant execute on function public.get_admin_operational_overview() to authenticated;
