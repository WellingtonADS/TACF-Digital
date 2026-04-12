create or replace function public.get_evaluation_index_rows()
returns setof public.evaluation_index_rows
language sql
security definer
set search_path = public
as $$
  select e.*
  from public.evaluation_index_rows e
  order by e.sort_order asc, e.faixa asc;
$$;

create or replace function public.save_evaluation_index_row(
  p_id uuid,
  p_faixa text,
  p_corrida text,
  p_flexao text,
  p_abdominal text,
  p_conceito text,
  p_sort_order integer default null
)
returns public.evaluation_index_rows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_user_name text;
  v_row public.evaluation_index_rows;
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

  if nullif(trim(p_faixa), '') is null then
    raise exception 'faixa obrigatoria';
  end if;

  if nullif(trim(p_corrida), '') is null
    or nullif(trim(p_flexao), '') is null
    or nullif(trim(p_abdominal), '') is null
    or nullif(trim(p_conceito), '') is null then
    raise exception 'todos os campos do indice sao obrigatorios';
  end if;

  update public.evaluation_index_rows e
  set
    faixa = trim(p_faixa),
    corrida = trim(p_corrida),
    flexao = trim(p_flexao),
    abdominal = trim(p_abdominal),
    conceito = trim(p_conceito),
    sort_order = coalesce(p_sort_order, e.sort_order),
    updated_at = now()
  where e.id = p_id
  returning * into v_row;

  if not found then
    raise exception 'linha de indice nao encontrada';
  end if;

  insert into public.audit_logs (action, entity, user_id, user_name, details)
  values (
    'update',
    'evaluation_index_row',
    v_uid,
    coalesce(v_user_name, 'sistema'),
    format('evaluation_index_row_id=%s; faixa=%s; conceito=%s', v_row.id, v_row.faixa, v_row.conceito)
  );

  return v_row;
end;
$$;

revoke all on function public.get_evaluation_index_rows() from public;
grant execute on function public.get_evaluation_index_rows() to authenticated;

revoke all on function public.save_evaluation_index_row(uuid, text, text, text, text, text, integer) from public;
grant execute on function public.save_evaluation_index_row(uuid, text, text, text, text, text, integer) to authenticated;
