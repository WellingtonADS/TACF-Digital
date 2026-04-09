create or replace function public.reject_swap(
  p_request_id uuid,
  p_admin_id uuid,
  p_reason text default null
)
returns table (
  success boolean,
  error text,
  booking_id uuid,
  user_id uuid,
  swap_status public.swap_status
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
  v_booking public.bookings%rowtype;
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
    select false, 'swap request not found'::text, null::uuid, null::uuid, null::public.swap_status;
    return;
  end if;

  if v_request.status <> 'solicitado' then
    return query
    select false, 'swap request already processed'::text, v_request.booking_id, null::uuid, v_request.status;
    return;
  end if;

  select *
    into v_booking
  from public.bookings b
  where b.id = v_request.booking_id;

  update public.swap_requests
  set status = 'cancelado',
      processed_by = v_uid,
      processed_at = now(),
      updated_at = now()
  where id = v_request.id;

  if v_booking.user_id is not null then
    insert into public.user_notifications (
      recipient_user_id,
      sender_user_id,
      type,
      title,
      message,
      metadata
    ) values (
      v_booking.user_id,
      v_uid,
      'swap_rejected',
      'Reagendamento indeferido',
      'Sua solicitação de reagendamento foi indeferida pela coordenação.',
      jsonb_build_object(
        'swap_request_id', v_request.id,
        'booking_id', v_request.booking_id,
        'reason', nullif(trim(coalesce(p_reason, '')), '')
      )
    );
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'reject',
    'swap_request',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'swap_request_id=%s; booking_id=%s; reason=%s',
      v_request.id,
      v_request.booking_id,
      coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'sem_motivo')
    )
  );

  return query
  select true, null::text, v_request.booking_id, v_booking.user_id, 'cancelado'::public.swap_status;
exception
  when others then
    return query
    select false, sqlerrm::text, null::uuid, null::uuid, null::public.swap_status;
end;
$$;

revoke all on function public.reject_swap(uuid, uuid, text) from public;
grant execute on function public.reject_swap(uuid, uuid, text) to authenticated;
