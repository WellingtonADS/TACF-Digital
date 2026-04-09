alter table public.bookings
  drop constraint if exists unique_user_semester;

drop index if exists public.unique_user_semester;

create unique index if not exists idx_bookings_user_semester_active_unique
  on public.bookings (user_id, semester)
  where status = 'agendado'::public.booking_status;
