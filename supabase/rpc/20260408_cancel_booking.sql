create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns table(
  success boolean,
  error text,
  booking_id uuid,
  user_id uuid,
  booking_status public.booking_status,
  cancelled_swap_requests integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_booking public.bookings%rowtype;
  v_session_status public.session_status;
  v_reason text;
  v_cancelled_swap_requests integer := 0;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
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

  v_reason := nullif(trim(coalesce(p_reason, '')), '');

  select *
    into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    return query
    select
      false,
      'agendamento nao encontrado'::text,
      null::uuid,
      null::uuid,
      null::public.booking_status,
      0;
    return;
  end if;

  select s.status
    into v_session_status
  from public.sessions s
  where s.id = v_booking.session_id
  for update;

  if not found then
    return query
    select
      false,
      'sessao vinculada nao encontrada'::text,
      v_booking.id,
      v_booking.user_id,
      v_booking.status,
      0;
    return;
  end if;

  if v_booking.status = 'remarcado' then
    return query
    select
      false,
      'agendamento remarcado nao pode ser cancelado administrativamente'::text,
      v_booking.id,
      v_booking.user_id,
      v_booking.status,
      0;
    return;
  end if;

  if v_session_status = 'completed' then
    return query
    select
      false,
      'sessao concluida nao permite cancelamento administrativo de agendamento'::text,
      v_booking.id,
      v_booking.user_id,
      v_booking.status,
      0;
    return;
  end if;

  update public.swap_requests as sr
  set status = 'cancelado',
      processed_by = v_uid,
      processed_at = now(),
      updated_at = now()
  where sr.booking_id = v_booking.id
    and sr.status = 'solicitado';

  get diagnostics v_cancelled_swap_requests = row_count;

  if v_booking.status = 'cancelado' then
    if v_cancelled_swap_requests > 0 then
      insert into public.audit_logs (action, entity, user_id, user_name, details)
      values (
        'update',
        'booking',
        v_uid,
        coalesce(v_user_name, 'sistema'),
        format(
          'booking_id=%s; action=cancel_booking_cleanup; cancelled_swap_requests=%s',
          v_booking.id,
          v_cancelled_swap_requests
        )
      );
    end if;

    return query
    select
      true,
      null::text,
      v_booking.id,
      v_booking.user_id,
      v_booking.status,
      v_cancelled_swap_requests;
    return;
  end if;

  update public.bookings
  set status = 'cancelado',
      attendance_confirmed = false,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'cancellation_source', 'admin',
        'cancellation_reason', v_reason,
        'cancelled_at', now(),
        'cancelled_by', v_uid
      ),
      updated_at = now()
  where id = v_booking.id
  returning * into v_booking;

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
      'booking_cancelled',
      'Agendamento cancelado pela coordenação',
      case
        when v_reason is null then 'Seu agendamento TACF foi cancelado pela administração.'
        else format(
          'Seu agendamento TACF foi cancelado pela administração. Motivo: %s.',
          v_reason
        )
      end,
      jsonb_build_object(
        'booking_id', v_booking.id,
        'session_id', v_booking.session_id,
        'reason', v_reason
      )
    );
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'booking',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'booking_id=%s; session_id=%s; action=cancel_booking; status=cancelado; cancelled_swap_requests=%s; reason=%s',
      v_booking.id,
      v_booking.session_id,
      v_cancelled_swap_requests,
      coalesce(v_reason, 'sem_motivo')
    )
  );

  return query
  select
    true,
    null::text,
    v_booking.id,
    v_booking.user_id,
    v_booking.status,
    v_cancelled_swap_requests;
exception
  when others then
    return query
    select
      false,
      sqlerrm::text,
      null::uuid,
      null::uuid,
      null::public.booking_status,
      0;
end;
$$;

revoke all on function public.cancel_booking(uuid, text) from public;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
