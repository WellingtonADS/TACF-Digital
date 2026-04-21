create or replace function public.send_pending_revalidation_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_level text default 'warning',
  p_context jsonb default null
)
returns table(notification_id uuid, success boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_notification_id uuid;
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

  insert into public.user_notifications (
    user_id,
    title,
    message,
    level,
    context,
    created_by
  )
  values (
    p_user_id,
    nullif(trim(p_title), ''),
    nullif(trim(p_message), ''),
    case
      when p_level in ('info', 'warning', 'error') then p_level
      else 'warning'
    end,
    p_context,
    v_uid
  )
  returning id into v_notification_id;

  perform public.log_audit_event(
    'send_pending_revalidation_notification',
    'user_notifications',
    format(
      'destinatario=%s; remetente=%s; titulo=%s',
      p_user_id,
      v_user_name,
      coalesce(p_title, '')
    )
  );

  return query
  select v_notification_id, true;
end;
$$;

revoke all on function public.send_pending_revalidation_notification(uuid, text, text, text, jsonb) from public;
grant execute on function public.send_pending_revalidation_notification(uuid, text, text, text, jsonb) to authenticated;
