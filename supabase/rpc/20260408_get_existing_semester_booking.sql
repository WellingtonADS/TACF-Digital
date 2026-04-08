create or replace function public.get_existing_semester_booking(
  p_semester text
)
returns table (
  id uuid,
  test_date date
)
language sql
stable
as $$
  select b.id, b.test_date
  from public.bookings b
  where b.user_id = auth.uid()
    and b.status = 'agendado'
    and b.semester::text = p_semester
  order by b.created_at desc
  limit 1;
$$;
