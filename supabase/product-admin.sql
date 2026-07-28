-- Product admin fields for clothing catalog
alter table public."Products"
  add column if not exists category text,
  add column if not exists sold_out boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.product_variant
  add column if not exists size text;

create unique index if not exists product_variant_product_size_color_uidx
  on public.product_variant (product_id, lower(coalesce(size, '')), lower(coalesce(color, '')));
