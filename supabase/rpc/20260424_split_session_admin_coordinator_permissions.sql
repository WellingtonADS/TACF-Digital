create or replace function public.update_open_session_operational(
  p_session_id uuid,
  p_period public.session_period,
  p_capacity integer,
  p_max_capacity integer,
  p_location_id uuid,
  p_coordinator_id uuid
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
  v_session_status public.session_status;
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

  if p_capacity is null or p_capacity < 1 then
    raise exception 'capacidade minima invalida';
  end if;

  if p_max_capacity is null or p_max_capacity < p_capacity then
    raise exception 'capacidade maxima invalida';
  end if;

  if p_location_id is null then
    raise exception 'local obrigatorio';
  end if;

  if p_coordinator_id is null then
    raise exception 'coordenador obrigatorio';
  end if;

  if not exists (
    select 1
    from public.locations l
    where l.id = p_location_id
      and coalesce(l.status, 'active') = 'active'
  ) then
    raise exception 'local invalido';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_coordinator_id
      and p.role = 'coordinator'
      and coalesce(p.active, true) = true
  ) then
    raise exception 'coordenador invalido';
  end if;

  select s.status
    into v_session_status
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    raise exception 'sessao nao encontrada';
  end if;

  if v_session_status <> 'open' then
    raise exception 'sessao bloqueada para edicao operacional';
  end if;

  update public.sessions s
  set period = p_period,
      capacity = p_capacity,
      max_capacity = p_max_capacity,
      location_id = p_location_id,
      coordinator_id = p_coordinator_id,
      applicators = array[p_coordinator_id],
      updated_at = now()
  where s.id = p_session_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'session_id=%s; operational_update=true; role=%s; period=%s; capacity=%s; max_capacity=%s; location_id=%s; coordinator_id=%s',
      p_session_id,
      v_role,
      p_period,
      p_capacity,
      p_max_capacity,
      p_location_id,
      p_coordinator_id
    )
  );
end;
$$;

create or replace function public.delete_session_permanently(
  p_session_id uuid
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
  v_session_status public.session_status;
  v_booking_count integer := 0;
  v_swap_target_count integer := 0;
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

  if v_role is distinct from 'admin' then
    raise exception 'forbidden';
  end if;

  select s.status
    into v_session_status
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    raise exception 'sessao nao encontrada';
  end if;

  if v_session_status = 'completed' then
    raise exception 'sessao concluida nao pode ser excluida definitivamente';
  end if;

  select count(*)::integer
    into v_booking_count
  from public.bookings b
  where b.session_id = p_session_id;

  if v_booking_count > 0 then
    raise exception 'sessao possui agendamentos vinculados';
  end if;

  select count(*)::integer
    into v_swap_target_count
  from public.swap_requests sr
  where sr.new_session_id = p_session_id;

  if v_swap_target_count > 0 then
    raise exception 'sessao possui solicitacoes de troca vinculadas';
  end if;

  delete from public.sessions s
  where s.id = p_session_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'delete',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'session_id=%s; definitive_delete=true',
      p_session_id
    )
  );
end;
$$;
