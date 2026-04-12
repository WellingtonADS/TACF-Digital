create table if not exists public.evaluation_index_rows (
  id uuid primary key default gen_random_uuid(),
  faixa text not null,
  corrida text not null,
  flexao text not null,
  abdominal text not null,
  conceito text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_evaluation_index_rows_sort_order
  on public.evaluation_index_rows (sort_order asc, faixa asc);

insert into public.evaluation_index_rows (
  faixa,
  corrida,
  flexao,
  abdominal,
  conceito,
  sort_order
)
select *
from (
  values
    ('Ate 24 anos', '12:00', '30', '35', 'EXCELENTE', 10),
    ('25 a 29 anos', '12:30', '28', '33', 'MUITO BOM', 20),
    ('30 a 35 anos', '13:00', '25', '30', 'BOM', 30)
) as seed(faixa, corrida, flexao, abdominal, conceito, sort_order)
where not exists (
  select 1 from public.evaluation_index_rows
);

alter table public.evaluation_index_rows enable row level security;

drop policy if exists evaluation_index_rows_select_admin_only on public.evaluation_index_rows;
create policy evaluation_index_rows_select_admin_only
  on public.evaluation_index_rows
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::public.user_role
        and coalesce(p.active, true) = true
    )
  );

drop policy if exists evaluation_index_rows_write_admin_only on public.evaluation_index_rows;
create policy evaluation_index_rows_write_admin_only
  on public.evaluation_index_rows
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::public.user_role
        and coalesce(p.active, true) = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::public.user_role
        and coalesce(p.active, true) = true
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_evaluation_index_rows_updated_at'
  ) then
    create trigger update_evaluation_index_rows_updated_at
      before update on public.evaluation_index_rows
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;
