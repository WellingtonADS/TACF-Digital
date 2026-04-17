create table if not exists public.evaluation_index_rows (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'masculino',
  faixa text not null,
  corrida text not null,
  flexao text not null,
  abdominal text not null,
  conceito text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluation_index_rows_category_check
    check (category in ('masculino', 'feminino'))
);

create index if not exists idx_evaluation_index_rows_category_sort
  on public.evaluation_index_rows (category, sort_order, faixa);

create or replace function public.get_evaluation_index_rows(
  p_category text default 'masculino'
)
returns setof public.evaluation_index_rows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is distinct from 'admin' then
    raise exception 'forbidden';
  end if;

  return query
  select e.*
  from public.evaluation_index_rows e
  where e.category = coalesce(p_category, 'masculino')
  order by e.sort_order asc, e.faixa asc;
end;
$$;

create or replace function public.upsert_evaluation_index_row(
  p_id uuid default null,
  p_category text default 'masculino',
  p_faixa text default null,
  p_corrida text default null,
  p_flexao text default null,
  p_abdominal text default null,
  p_conceito text default null,
  p_sort_order integer default 0
)
returns public.evaluation_index_rows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_row public.evaluation_index_rows;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is distinct from 'admin' then
    raise exception 'forbidden';
  end if;

  if p_category not in ('masculino', 'feminino') then
    raise exception 'categoria invalida';
  end if;

  if p_faixa is null or btrim(p_faixa) = '' then
    raise exception 'faixa obrigatoria';
  end if;

  if p_corrida is null or btrim(p_corrida) = '' then
    raise exception 'corrida obrigatoria';
  end if;

  if p_flexao is null or btrim(p_flexao) = '' then
    raise exception 'flexao obrigatoria';
  end if;

  if p_abdominal is null or btrim(p_abdominal) = '' then
    raise exception 'abdominal obrigatorio';
  end if;

  if p_conceito is null or btrim(p_conceito) = '' then
    raise exception 'conceito obrigatorio';
  end if;

  insert into public.evaluation_index_rows (
    id,
    category,
    faixa,
    corrida,
    flexao,
    abdominal,
    conceito,
    sort_order
  )
  values (
    coalesce(p_id, gen_random_uuid()),
    p_category,
    btrim(p_faixa),
    btrim(p_corrida),
    btrim(p_flexao),
    btrim(p_abdominal),
    upper(btrim(p_conceito)),
    coalesce(p_sort_order, 0)
  )
  on conflict (id) do update
  set category = excluded.category,
      faixa = excluded.faixa,
      corrida = excluded.corrida,
      flexao = excluded.flexao,
      abdominal = excluded.abdominal,
      conceito = excluded.conceito,
      sort_order = excluded.sort_order,
      updated_at = now()
  returning *
  into v_row;

  return v_row;
end;
$$;

create or replace function public.delete_evaluation_index_row(
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
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is distinct from 'admin' then
    raise exception 'forbidden';
  end if;

  delete from public.evaluation_index_rows
  where id = p_id;
end;
$$;

create or replace function public.set_booking_result(
  p_booking_id uuid,
  p_result text default null,
  p_result_payload jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_result_status text;
  v_payload jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid
    and coalesce(p.active, true) = true
  limit 1;

  if v_role is null or v_role not in ('admin', 'coordinator') then
    raise exception 'forbidden';
  end if;

  v_result_status := lower(coalesce(p_result_payload ->> 'result_status', p_result));

  if v_result_status not in ('apto', 'inapto', 'pendente') then
    raise exception 'resultado invalido';
  end if;

  v_payload := coalesce(p_result_payload, '{}'::jsonb);
  v_payload := jsonb_strip_nulls(
    v_payload
    || jsonb_build_object(
      'result_status', v_result_status,
      'result', v_result_status,
      'updated_at', now()
    )
  );

  update public.bookings
  set result_details = v_payload,
      updated_at = now()
  where id = p_booking_id;

  if not found then
    raise exception 'agendamento nao encontrado';
  end if;
end;
$$;
