-- Run this in the Supabase SQL Editor

-- Expand order statuses used by the admin CRM
-- Existing rows with 'pending' remain valid.
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'delivered', 'cancelled', 'declined', 'returned'));

-- Customer-level bans (block future checkout by phone)
create table if not exists public.banned_customers (
  phone text primary key,
  name text,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.banned_customers enable row level security;

-- Public can check ban status at checkout (read-only by phone via app query)
drop policy if exists "Public can read banned customers" on public.banned_customers;
create policy "Public can read banned customers"
  on public.banned_customers
  for select
  to anon, authenticated
  using (true);

-- Writes only via service role (admin API). No insert/update/delete for anon.
