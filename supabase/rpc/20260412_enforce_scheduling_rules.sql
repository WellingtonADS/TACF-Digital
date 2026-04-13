-- Regras operacionais de agendamento:
-- 1. sessoes nao podem existir em sabados ou domingos
-- 2. militar (role=user) so pode agendar com antecedencia minima de 2 dias

create or replace function public.enforce_session_weekday_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_session_date date;
begin
  v_session_date := coalesce(new.date, (new.starts_at at time zone 'UTC')::date);

  if v_session_date is null then
    return new;
  end if;

  new.date := v_session_date;

  if extract(isodow from v_session_date) in (6, 7) then
    raise exception 'weekend sessions are not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_session_weekday_rules on public.sessions;

create trigger trg_enforce_session_weekday_rules
before insert or update of date, starts_at
on public.sessions
for each row
execute function public.enforce_session_weekday_rules();

create or replace function public.enforce_booking_lead_time_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_session_date date;
  v_role public.user_role;
begin
  if new.session_id is null or new.user_id is null then
    return new;
  end if;

  select s.date
    into v_session_date
  from public.sessions s
  where s.id = new.session_id;

  if v_session_date is null then
    return new;
  end if;

  if extract(isodow from v_session_date) in (6, 7) then
    raise exception 'cannot book weekend session';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = new.user_id
  limit 1;

  if coalesce(v_role, 'user'::public.user_role) = 'user'::public.user_role
     and current_date > (v_session_date - 2) then
    raise exception 'military booking requires at least 2 days of lead time';
  end if;

  new.test_date := coalesce(new.test_date, v_session_date);

  return new;
end;
$$;

drop trigger if exists trg_enforce_booking_lead_time_rules on public.bookings;

create trigger trg_enforce_booking_lead_time_rules
before insert or update of session_id, user_id
on public.bookings
for each row
execute function public.enforce_booking_lead_time_rules();
