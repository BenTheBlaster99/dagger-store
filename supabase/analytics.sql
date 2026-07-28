-- Site analytics sessions (live visitors / sessions / conversion)
create table if not exists public.analytics_sessions (
  session_id text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  pageviews integer not null default 1,
  landing_path text,
  last_path text,
  referrer text,
  user_agent text,
  converted boolean not null default false
);

create index if not exists analytics_sessions_last_seen_idx
  on public.analytics_sessions (last_seen_at desc);

create index if not exists analytics_sessions_first_seen_idx
  on public.analytics_sessions (first_seen_at desc);

alter table public.analytics_sessions enable row level security;
