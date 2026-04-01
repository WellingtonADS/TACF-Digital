-- Criação transacional de sessões em lote com validações críticas no banco.
-- Frontend fica responsável apenas por validações de UX.

create or replace function public.create_sessions_batch(
  p_rows jsonb
)
returns table(
  success boolean,
  created_count integer,
  created_ids uuid[],
  error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_item jsonb;
  v_date date;
  v_period public.session_period;
  v_max_capacity integer;
  v_location_id uuid;
  v_applicators text[];
  v_status public.session_status;
  v_created_ids uuid[] := '{}';
  v_created_id uuid;
  v_dup_count integer;
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

  if v_role is null or v_role <> 'admin' then
    raise exception 'forbidden';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'lote invalido';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception 'lote vazio';
  end if;

  -- Impede duplicidade dentro do próprio lote por dia/turno/local.
  select count(*)
    into v_dup_count
  from (
    select
      item->>'date' as date_key,
      item->>'period' as period_key,
      item->>'location_id' as location_key,
      count(*) as c
    from jsonb_array_elements(p_rows) as item
    group by 1, 2, 3
    having count(*) > 1
  ) dup;

  if coalesce(v_dup_count, 0) > 0 then
    raise exception 'duplicidade no lote para dia/turno/local';
  end if;

  for v_item in select * from jsonb_array_elements(p_rows)
  loop
    begin
      v_date := (v_item->>'date')::date;
    exception when others then
      raise exception 'data invalida no lote';
    end;

    begin
      v_period := (v_item->>'period')::public.session_period;
    exception when others then
      raise exception 'periodo invalido no lote';
    end;

    begin
      v_max_capacity := (v_item->>'max_capacity')::integer;
    exception when others then
      raise exception 'capacidade invalida no lote';
    end;

    begin
      v_location_id := (v_item->>'location_id')::uuid;
    exception when others then
      raise exception 'local invalido no lote';
    end;

    select coalesce(array_agg(value), '{}')
      into v_applicators
    from jsonb_array_elements_text(coalesce(v_item->'applicators', '[]'::jsonb));

    if v_date is null then
      raise exception 'data obrigatoria';
    end if;

    if v_period is null then
      raise exception 'periodo obrigatorio';
    end if;

    if v_location_id is null then
      raise exception 'local obrigatorio';
    end if;

    if v_max_capacity is null or v_max_capacity < 8 or v_max_capacity > 21 then
      raise exception 'capacidade fora da faixa permitida (8-21)';
    end if;

    if coalesce(array_length(v_applicators, 1), 0) = 0 then
      raise exception 'aplicador obrigatorio';
    end if;

    if v_item ? 'status' then
      begin
        v_status := (v_item->>'status')::public.session_status;
      exception when others then
        raise exception 'status invalido';
      end;

      if v_status not in ('open', 'closed') then
        raise exception 'status permitido apenas open ou closed na criacao';
      end if;
    else
      v_status := 'open';
    end if;

    if exists (
      select 1
      from public.sessions s
      where s.date = v_date
        and s.period = v_period
        and s.location_id = v_location_id
    ) then
      raise exception 'ja existe sessao para dia/turno/local';
    end if;

    insert into public.sessions (
      date,
      period,
      max_capacity,
      location_id,
      applicators,
      status
    ) values (
      v_date,
      v_period,
      v_max_capacity,
      v_location_id,
      v_applicators,
      v_status
    )
    returning id into v_created_id;

    v_created_ids := array_append(v_created_ids, v_created_id);

    insert into public.audit_logs (action, entity, user_id, user_name, details)
    values (
      'SESSION_CREATED',
      'session',
      v_uid,
      coalesce(v_user_name, 'sistema'),
      jsonb_build_object(
        'session_id', v_created_id,
        'actor_id', v_uid,
        'timestamp', now(),
        'source', 'create_sessions_batch',
        'date', v_date,
        'period', v_period,
        'location_id', v_location_id,
        'max_capacity', v_max_capacity
      )::text
    );
  end loop;

  return query
  select true, coalesce(array_length(v_created_ids, 1), 0), v_created_ids, null::text;
exception
  when others then
    return query
    select false, 0, '{}'::uuid[], sqlerrm;
end;
$$;
