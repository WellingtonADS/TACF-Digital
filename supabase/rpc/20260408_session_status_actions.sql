create or replace function public.cancel_session(
  p_session_id uuid
)
returns table(
  success boolean,
  error text,
  session_status public.session_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_current_status public.session_status;
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

  select s.status
    into v_current_status
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    return query
    select false, 'sessao nao encontrada'::text, null::public.session_status;
    return;
  end if;

  if v_current_status = 'completed' then
    return query
    select false, 'sessao concluida nao pode ser cancelada'::text, v_current_status;
    return;
  end if;

  if v_current_status = 'closed' then
    return query
    select true, null::text, v_current_status;
    return;
  end if;

  update public.sessions
  set status = 'closed',
      updated_at = now()
  where id = p_session_id
  returning status into v_current_status;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('session_id=%s; action=cancel_session; status=closed', p_session_id)
  );

  return query
  select true, null::text, v_current_status;
end;
$$;

revoke all on function public.cancel_session(uuid) from public;
grant execute on function public.cancel_session(uuid) to authenticated;

create or replace function public.reopen_session(
  p_session_id uuid
)
returns table(
  success boolean,
  error text,
  session_status public.session_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_current_status public.session_status;
  v_session_date date;
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

  select s.status, s.date
    into v_current_status, v_session_date
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found then
    return query
    select false, 'sessao nao encontrada'::text, null::public.session_status;
    return;
  end if;

  if v_current_status = 'completed' then
    return query
    select false, 'sessao concluida nao pode ser reaberta'::text, v_current_status;
    return;
  end if;

  if v_current_status = 'open' then
    return query
    select true, null::text, v_current_status;
    return;
  end if;

  if v_session_date < current_date then
    return query
    select false, 'sessao com data passada nao pode ser reaberta'::text, v_current_status;
    return;
  end if;

  update public.sessions
  set status = 'open',
      updated_at = now()
  where id = p_session_id
  returning status into v_current_status;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'session',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('session_id=%s; action=reopen_session; status=open', p_session_id)
  );

  return query
  select true, null::text, v_current_status;
end;
$$;

revoke all on function public.reopen_session(uuid) from public;
grant execute on function public.reopen_session(uuid) to authenticated;
