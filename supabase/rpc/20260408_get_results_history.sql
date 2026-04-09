create or replace function public.get_results_history(
  p_limit integer,
  p_cursor text,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
  v_has_more boolean := false;
  v_next_cursor text := null;
  v_arg jsonb;
begin
  if p_cursor is not null then
    v_arg := convert_from(decode(p_cursor, 'base64'), 'utf8')::jsonb;

    select jsonb_agg(row_to_json(t))
      into v_rows
    from (
      select
        b.id,
        b.user_id as profile_id,
        p.full_name,
        p.saram,
        b.score,
        b.result_details,
        b.test_date,
        b.created_at,
        b.status as booking_status,
        b.metadata as booking_metadata,
        b.order_number,
        b.attendance_confirmed,
        s.period as session_period,
        l.name as location
      from public.bookings b
      left join public.profiles p
        on p.id = b.user_id
      left join public.sessions s
        on s.id = b.session_id
      left join public.locations l
        on l.id = s.location_id
      where (b.created_at, b.id) < (
          (v_arg->>'created_at')::timestamptz,
          (v_arg->>'id')::uuid
        )
        and (p_from is null or b.test_date >= p_from)
        and (p_to is null or b.test_date <= p_to)
        and b.user_id = auth.uid()
      order by b.created_at desc, b.id desc
      limit p_limit
    ) t;
  else
    select jsonb_agg(row_to_json(t))
      into v_rows
    from (
      select
        b.id,
        b.user_id as profile_id,
        p.full_name,
        p.saram,
        b.score,
        b.result_details,
        b.test_date,
        b.created_at,
        b.status as booking_status,
        b.metadata as booking_metadata,
        b.order_number,
        b.attendance_confirmed,
        s.period as session_period,
        l.name as location
      from public.bookings b
      left join public.profiles p
        on p.id = b.user_id
      left join public.sessions s
        on s.id = b.session_id
      left join public.locations l
        on l.id = s.location_id
      where (p_from is null or b.test_date >= p_from)
        and (p_to is null or b.test_date <= p_to)
        and b.user_id = auth.uid()
      order by b.created_at desc, b.id desc
      limit p_limit
    ) t;
  end if;

  if v_rows is null or v_rows = 'null'::jsonb then
    v_rows := '[]'::jsonb;
    v_has_more := false;
    v_next_cursor := null;
  else
    if jsonb_array_length(v_rows) = p_limit then
      v_has_more := true;
      v_next_cursor := (
        select encode(
          convert_to(
            jsonb_build_object(
              'created_at',
              (elem->>'created_at')::text,
              'id',
              elem->>'id'
            )::text,
            'utf8'
          ),
          'base64'
        )
        from jsonb_array_elements(v_rows) with ordinality arr(elem, idx)
        where idx = jsonb_array_length(v_rows)
        limit 1
      );
    else
      v_has_more := false;
      v_next_cursor := null;
    end if;
  end if;

  return jsonb_build_object(
    'rows',
    v_rows,
    'next_cursor',
    v_next_cursor,
    'has_more',
    v_has_more
  );
end;
$$;

revoke all on function public.get_results_history(integer, text, date, date) from public;
grant execute on function public.get_results_history(integer, text, date, date) to authenticated;
