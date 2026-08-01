-- CRM leads imported from Nocturnal / Abandoned CSV exports
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('client', 'abandoned')),
  external_id text,
  occurred_at timestamptz,
  customer_name text,
  city text,
  address text,
  phone text,
  product_title text,
  quantity integer default 1,
  total_price numeric,
  created_at timestamptz not null default now()
);

create index if not exists crm_leads_source_idx on public.crm_leads (source);
create index if not exists crm_leads_occurred_idx on public.crm_leads (occurred_at desc);
create index if not exists crm_leads_phone_idx on public.crm_leads (phone);

alter table public.crm_leads enable row level security;
