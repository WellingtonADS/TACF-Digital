-- In-app inbox notifications for military users.
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_user_id uuid null references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_notifications_recipient_created
  on public.user_notifications (recipient_user_id, created_at desc);

create index if not exists idx_user_notifications_recipient_unread
  on public.user_notifications (recipient_user_id, is_read)
  where is_read = false;

alter table public.user_notifications enable row level security;

-- Recipient can read and update its own inbox.
drop policy if exists "user_notifications_select_own"
  on public.user_notifications;

create policy "user_notifications_select_own"
  on public.user_notifications
  for select
  using (recipient_user_id = auth.uid());

drop policy if exists "user_notifications_update_own"
  on public.user_notifications;

create policy "user_notifications_update_own"
  on public.user_notifications
  for update
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- Admin/coordinator can create notifications.
drop policy if exists "user_notifications_insert_admin_coordinator"
  on public.user_notifications;

create policy "user_notifications_insert_admin_coordinator"
  on public.user_notifications
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'coordinator')
        and p.active = true
    )
  );
