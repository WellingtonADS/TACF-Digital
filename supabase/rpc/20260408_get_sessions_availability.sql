drop function if exists public.get_sessions_availability(date, date);

create or replace function public.get_sessions_availability(
  p_start date,
  p_end date
)
returns table (
  session_id uuid,
  date date,
  period text,
  max_capacity integer,
  occupied_count bigint,
  available_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as session_id,
    s.date,
    s.period::text as period,
    s.max_capacity,
    count(b.id) as occupied_count,
    (s.max_capacity - count(b.id)) as available_count
  from public.sessions s
  left join public.bookings b
    on b.session_id = s.id
   and b.status = 'agendado'
  where s.date >= p_start
    and s.date <= p_end
  group by s.id, s.date, s.period, s.max_capacity
  order by s.date, s.period;
$$;

revoke all on function public.get_sessions_availability(date, date) from public;
grant execute on function public.get_sessions_availability(date, date)
  to anon, authenticated;
