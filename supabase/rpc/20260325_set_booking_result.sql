-- Permite que admin/coordinator lancem resultado (apto/inapto)
-- sem abrir UPDATE amplo na tabela bookings.
create or replace function public.set_booking_result(
  p_booking_id uuid,
  p_result text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role, p.full_name
    into v_role, v_user_name
  from public.profiles p
  where p.id = v_uid
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  if p_result not in ('apto', 'inapto') then
    raise exception 'resultado invalido';
  end if;

  update public.bookings b
  set result_details = to_jsonb(p_result),
      updated_at = now()
  where b.id = p_booking_id;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'booking',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('result_details=%s; booking_id=%s', p_result, p_booking_id)
  );
end;
$$;
