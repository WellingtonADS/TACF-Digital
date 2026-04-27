create or replace function public.has_session_action_permission(
  p_role public.user_role,
  p_metadata jsonb,
  p_permission text
)
returns boolean
language sql
stable
as $$
  select
    coalesce(
      p_role = 'admin'
      or (
        p_role = 'coordinator'
        and coalesce((p_metadata -> 'session_permissions' ->> p_permission)::boolean, false)
      ),
      false
    );
$$;

create or replace function public.create_sessions_with_permission(
  p_sessions jsonb,
  p_required_permission text
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_metadata jsonb;
  v_user_name text;
  v_created_ids uuid[];
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  if p_required_permission not in ('create_session', 'duplicate_session') then
    raise exception 'permissao de sessao invalida';
  end if;

  if jsonb_typeof(p_sessions) <> 'array' or jsonb_array_length(p_sessions) = 0 then
    raise exception 'nenhuma sessao informada';
  end if;

  select p.role, p.metadata, p.full_name
    into v_role, v_metadata, v_user_name
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if not public.has_session_action_permission(v_role, coalesce(v_metadata, '{}'::jsonb), p_required_permission) then
    raise exception 'forbidden';
  end if;

  with input_rows as (
    select *
    from jsonb_to_recordset(p_sessions) as row_data(
      date date,
      period public.session_period,
      capacity integer,
      max_capacity integer,
      metadata jsonb,
      location_id uuid,
      coordinator_id uuid,
      status public.session_status
    )
  ),
  validated_rows as (
    select
      row_data.date,
      row_data.period,
      row_data.capacity,
      row_data.max_capacity,
      coalesce(row_data.metadata, '{}'::jsonb) as metadata,
      row_data.location_id,
      row_data.coordinator_id,
      coalesce(row_data.status, 'open'::public.session_status) as status
    from input_rows row_data
  ),
  invalid_rows as (
    select 1
    from validated_rows row_data
    where row_data.date is null
       or row_data.period is null
       or row_data.capacity is null
       or row_data.capacity < 1
       or row_data.max_capacity is null
       or row_data.max_capacity < row_data.capacity
       or row_data.location_id is null
       or row_data.coordinator_id is null
       or row_data.status <> 'open'
       or not exists (
          select 1
          from public.locations l
          where l.id = row_data.location_id
            and coalesce(l.status, 'active') = 'active'
       )
       or not exists (
          select 1
          from public.profiles p
          where p.id = row_data.coordinator_id
            and p.role = 'coordinator'
            and coalesce(p.active, true) = true
       )
    limit 1
  )
  select case when exists (select 1 from invalid_rows) then null else array[]::uuid[] end
    into v_created_ids;

  if v_created_ids is null then
    raise exception 'dados invalidos para criacao de sessao';
  end if;

  with input_rows as (
    select *
    from jsonb_to_recordset(p_sessions) as row_data(
      date date,
      period public.session_period,
      capacity integer,
      max_capacity integer,
      metadata jsonb,
      location_id uuid,
      coordinator_id uuid,
      status public.session_status
    )
  ),
  inserted as (
    insert into public.sessions (
      date,
      period,
      capacity,
      max_capacity,
      metadata,
      location_id,
      coordinator_id,
      applicators,
      status
    )
    select
      row_data.date,
      row_data.period,
      row_data.capacity,
      row_data.max_capacity,
      coalesce(row_data.metadata, '{}'::jsonb),
      row_data.location_id,
      row_data.coordinator_id,
      array[row_data.coordinator_id::text],
      'open'::public.session_status
    from input_rows row_data
    returning id
  )
  select array_agg(id)
    into v_created_ids
  from inserted;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'create',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'created_count=%s; required_permission=%s; role=%s',
      coalesce(array_length(v_created_ids, 1), 0),
      p_required_permission,
      v_role
    )
  );

  return coalesce(v_created_ids, array[]::uuid[]);
end;
$$;

create or replace function public.cancel_session_with_permission(
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
  v_metadata jsonb;
  v_user_name text;
  v_session_status public.session_status;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role, p.metadata, p.full_name
    into v_role, v_metadata, v_user_name
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if not public.has_session_action_permission(v_role, coalesce(v_metadata, '{}'::jsonb), 'cancel_session') then
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

  if v_session_status <> 'open' then
    raise exception 'apenas sessoes abertas podem ser canceladas';
  end if;

  update public.sessions s
  set status = 'closed',
      updated_at = now()
  where s.id = p_session_id;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format(
      'session_id=%s; cancelled=true; role=%s',
      p_session_id,
      v_role
    )
  );
end;
$$;
