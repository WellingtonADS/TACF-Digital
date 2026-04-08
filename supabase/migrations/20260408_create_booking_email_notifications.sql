create table if not exists public.booking_email_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  notification_type text not null
    check (notification_type in ('booking_confirmation', 'booking_reminder')),
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0,
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, notification_type)
);

create index if not exists idx_booking_email_notifications_due
  on public.booking_email_notifications (status, scheduled_for);

create index if not exists idx_booking_email_notifications_booking
  on public.booking_email_notifications (booking_id);

alter table public.booking_email_notifications enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_booking_email_notifications_updated_at'
  ) then
    create trigger update_booking_email_notifications_updated_at
      before update on public.booking_email_notifications
      for each row
      execute function update_updated_at_column();
  end if;
end
$$;
