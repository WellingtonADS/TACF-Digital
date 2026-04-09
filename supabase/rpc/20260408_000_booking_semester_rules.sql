create or replace function public.extract_booking_result_status(
  p_result_details jsonb
)
returns text
language sql
immutable
as $$
  select case
    when p_result_details is null then null::text
    when jsonb_typeof(p_result_details) = 'string' then
      lower(nullif(trim(both '"' from p_result_details::text), ''))
    when jsonb_typeof(p_result_details) = 'object' then
      lower(
        coalesce(
          nullif(trim(p_result_details->>'result_status'), ''),
          nullif(trim(p_result_details->>'status'), '')
        )
      )
    else null::text
  end;
$$;

create or replace function public.user_has_semester_approved_result(
  p_user_id uuid,
  p_start date,
  p_end date,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.user_id = p_user_id
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and b.test_date between p_start and p_end
      and public.extract_booking_result_status(b.result_details) in (
        'apto',
        'approved',
        'aprovado'
      )
  );
$$;

revoke all on function public.extract_booking_result_status(jsonb) from public;
grant execute on function public.extract_booking_result_status(jsonb) to authenticated;

revoke all on function public.user_has_semester_approved_result(uuid, date, date, uuid) from public;
grant execute on function public.user_has_semester_approved_result(uuid, date, date, uuid) to authenticated;
