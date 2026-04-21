create or replace function public.log_audit_event(
  p_action text,
  p_entity text,
  p_details text default null
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

  select p.role, coalesce(p.war_name, p.full_name, p.email, 'sistema')
    into v_role, v_user_name
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    nullif(trim(p_action), ''),
    nullif(trim(p_entity), ''),
    v_uid,
    v_user_name,
    p_details
  );
end;
$$;

revoke all on function public.log_audit_event(text, text, text) from public;
grant execute on function public.log_audit_event(text, text, text) to authenticated;
