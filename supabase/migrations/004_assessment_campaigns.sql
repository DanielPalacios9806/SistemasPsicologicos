create table if not exists public.assessment_campaigns (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists assessment_campaigns_name_uidx
  on public.assessment_campaigns (name);

insert into public.assessment_campaigns (name, starts_at, ends_at, active)
values (
  'Evaluaciones Psicologicas 2026',
  '2026-08-17 00:00:00-05',
  '2026-09-17 23:59:59-05',
  true
)
on conflict (name) do nothing;
