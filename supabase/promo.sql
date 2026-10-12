-- One store-wide promo. Saving or refreshing sets expires_at to now + 3 hours.
create table if not exists public.store_promo (
  id int primary key default 1 check (id = 1),
  code text,
  discount_da integer,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint store_promo_da_chk check (
    discount_da is null or (discount_da >= 1 and discount_da <= 100000)
  )
);

insert into public.store_promo (id)
values (1)
on conflict (id) do nothing;

alter table public.store_promo enable row level security;
