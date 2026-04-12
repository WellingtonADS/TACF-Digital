create or replace function public.get_locations(
  p_search_term text default null,
  p_status text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  name text,
  address text,
  max_capacity integer,
  status text,
  facilities text[],
  metadata jsonb,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select l.*
    from public.locations l
    where (
      p_search_term is null
      or l.name ilike '%' || p_search_term || '%'
      or l.address ilike '%' || p_search_term || '%'
    )
      and (
        p_status is null
        or l.status = p_status
      )
  )
  select
    f.id,
    f.name,
    f.address,
    f.max_capacity,
    f.status,
    f.facilities,
    f.metadata,
    f.created_by,
    f.created_at,
    f.updated_at,
    count(*) over() as total_count
  from filtered f
  order by
    case f.status
      when 'active' then 0
      when 'maintenance' then 1
      else 2
    end,
    f.name asc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.create_location(
  p_name text,
  p_address text,
  p_max_capacity integer,
  p_status text default 'active',
  p_facilities text[] default null,
  p_metadata jsonb default null
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_location public.locations;
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

  if v_role is distinct from 'admin'::public.user_role then
    raise exception 'forbidden';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'nome do local obrigatorio';
  end if;

  if nullif(trim(p_address), '') is null then
    raise exception 'endereco do local obrigatorio';
  end if;

  if coalesce(p_max_capacity, 0) < 1 then
    raise exception 'capacidade maxima invalida';
  end if;

  if coalesce(p_status, 'active') not in ('active', 'maintenance', 'inactive') then
    raise exception 'status invalido';
  end if;

  insert into public.locations (
    name,
    address,
    max_capacity,
    status,
    facilities,
    metadata,
    created_by
  )
  values (
    trim(p_name),
    trim(p_address),
    p_max_capacity,
    coalesce(p_status, 'active'),
    coalesce(p_facilities, array[]::text[]),
    p_metadata,
    v_uid
  )
  returning * into v_location;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'create',
    'location',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('location_id=%s; name=%s; status=%s', v_location.id, v_location.name, v_location.status)
  );

  return v_location;
end;
$$;

create or replace function public.update_location(
  p_id uuid,
  p_name text default null,
  p_address text default null,
  p_max_capacity integer default null,
  p_status text default null,
  p_facilities text[] default null,
  p_metadata jsonb default null
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_location public.locations;
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

  if v_role is distinct from 'admin'::public.user_role then
    raise exception 'forbidden';
  end if;

  if p_status is not null and p_status not in ('active', 'maintenance', 'inactive') then
    raise exception 'status invalido';
  end if;

  if p_max_capacity is not null and p_max_capacity < 1 then
    raise exception 'capacidade maxima invalida';
  end if;

  update public.locations l
  set
    name = coalesce(nullif(trim(p_name), ''), l.name),
    address = coalesce(nullif(trim(p_address), ''), l.address),
    max_capacity = coalesce(p_max_capacity, l.max_capacity),
    status = coalesce(p_status, l.status),
    facilities = coalesce(p_facilities, l.facilities),
    metadata = coalesce(p_metadata, l.metadata),
    updated_at = now()
  where l.id = p_id
  returning * into v_location;

  if not found then
    raise exception 'local nao encontrado';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'location',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('location_id=%s; name=%s; status=%s', v_location.id, v_location.name, v_location.status)
  );

  return v_location;
end;
$$;

create or replace function public.delete_location(
  p_id uuid
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
  v_location public.locations;
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

  if v_role is distinct from 'admin'::public.user_role then
    raise exception 'forbidden';
  end if;

  update public.locations l
  set status = 'inactive',
      updated_at = now()
  where l.id = p_id
  returning * into v_location;

  if not found then
    raise exception 'local nao encontrado';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'location',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('location_id=%s; action=inactivate; status=%s', v_location.id, v_location.status)
  );
end;
$$;

revoke all on function public.get_locations(text, text, integer, integer) from public;
grant execute on function public.get_locations(text, text, integer, integer) to authenticated;

revoke all on function public.create_location(text, text, integer, text, text[], jsonb) from public;
grant execute on function public.create_location(text, text, integer, text, text[], jsonb) to authenticated;

revoke all on function public.update_location(uuid, text, text, integer, text, text[], jsonb) from public;
grant execute on function public.update_location(uuid, text, text, integer, text, text[], jsonb) to authenticated;

revoke all on function public.delete_location(uuid) from public;
grant execute on function public.delete_location(uuid) to authenticated;
