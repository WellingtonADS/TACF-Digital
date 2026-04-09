create or replace function public.get_booked_dates(
  p_start date,
  p_end date
)
returns table (
  test_date date
)
language sql
stable
as $$
  select b.test_date
  from public.bookings b
  where b.user_id = auth.uid()
    and b.test_date >= p_start
    and b.test_date <= p_end
    and b.status = 'agendado'
  order by b.test_date;
$$;
