create or replace function public.try_parse_audit_details_json(
  p_text text
)
returns jsonb
language plpgsql
immutable
as $$
begin
  if p_text is null or btrim(p_text) = '' then
    return '{}'::jsonb;
  end if;

  return p_text::jsonb;
exception
  when others then
    return jsonb_build_object('raw', p_text);
end;
$$;

create or replace function public.get_audit_logs_structured(
  p_limit integer default 500
)
returns table (
  id uuid,
  action text,
  entity text,
  user_id uuid,
  user_name text,
  created_at timestamptz,
  details_text text,
  details_json jsonb,
  ip_address text,
  audit_code text,
  audit_group text,
  target_id text,
  summary text
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select
      al.id,
      al.action,
      al.entity,
      al.user_id,
      al.user_name,
      al.created_at,
      al.details as details_text,
      case
        when al.details is null or btrim(al.details) = '' then '{}'::jsonb
        when left(ltrim(al.details), 1) in ('{', '[') then public.try_parse_audit_details_json(al.details)
        else coalesce(
          (
            select jsonb_object_agg(
              trim(split_part(part, '=', 1)),
              to_jsonb(nullif(trim(split_part(part, '=', 2)), ''))
            )
            from unnest(string_to_array(al.details, ';')) as part
            where trim(part) <> ''
              and trim(split_part(part, '=', 1)) <> ''
          ),
          jsonb_build_object('raw', al.details)
        )
      end as details_json
    from public.audit_logs al
    order by al.created_at desc
    limit greatest(coalesce(p_limit, 500), 1)
  )
  select
    n.id,
    n.action,
    n.entity,
    n.user_id,
    n.user_name,
    n.created_at,
    n.details_text,
    n.details_json,
    coalesce(n.details_json ->> 'ip', n.details_json ->> 'ip_address', '-') as ip_address,
    case
      when lower(coalesce(n.entity, '')) = 'session' and lower(coalesce(n.action, '')) = 'create' then 'SESSION_CREATED'
      when lower(coalesce(n.entity, '')) = 'booking' and n.details_text ilike '%attendance_confirmed=%' then 'ATTENDANCE_UPDATED'
      when lower(coalesce(n.entity, '')) = 'booking' and n.details_text ilike '%result_details=%' then 'RESULT_SET'
      when lower(coalesce(n.entity, '')) = 'swap_request' and lower(coalesce(n.action, '')) = 'create' then 'SWAP_REQUEST_CREATED'
      when lower(coalesce(n.entity, '')) = 'session' and (
        lower(coalesce(n.action, '')) like '%close%'
        or n.details_text ilike '%closure%'
        or n.details_text ilike '%session_closed%'
      ) then 'SESSION_CLOSED'
      else upper(concat_ws('_', coalesce(n.action, 'unknown'), coalesce(n.entity, 'system')))
    end as audit_code,
    case
      when lower(coalesce(n.entity, '')) = 'session' then 'turmas'
      when lower(coalesce(n.entity, '')) = 'booking' then 'agendamentos'
      when lower(coalesce(n.entity, '')) = 'swap_request' then 'reagendamentos'
      else coalesce(lower(n.entity), 'sistema')
    end as audit_group,
    coalesce(
      n.details_json ->> 'session_id',
      n.details_json ->> 'booking_id',
      n.details_json ->> 'swap_request_id',
      n.details_json ->> 'id'
    ) as target_id,
    case
      when lower(coalesce(n.entity, '')) = 'session' and lower(coalesce(n.action, '')) = 'create' then 'Turma criada'
      when lower(coalesce(n.entity, '')) = 'booking' and n.details_text ilike '%attendance_confirmed=true%' then 'Presença confirmada'
      when lower(coalesce(n.entity, '')) = 'booking' and n.details_text ilike '%attendance_confirmed=false%' then 'Presença removida'
      when lower(coalesce(n.entity, '')) = 'booking' and n.details_text ilike '%result_details=%' then 'Resultado registrado'
      when lower(coalesce(n.entity, '')) = 'swap_request' and lower(coalesce(n.action, '')) = 'create' then 'Solicitação de reagendamento criada'
      when lower(coalesce(n.entity, '')) = 'session' and (
        lower(coalesce(n.action, '')) like '%close%'
        or n.details_text ilike '%closure%'
        or n.details_text ilike '%session_closed%'
      ) then 'Sessão encerrada'
      else initcap(replace(coalesce(n.action, 'evento'), '_', ' '))
    end as summary
  from normalized n
  order by n.created_at desc;
$$;

comment on function public.get_audit_logs_structured(integer) is
'Retorna auditoria normalizada com taxonomia, detalhes JSON e resumo legível para UI administrativa.';
