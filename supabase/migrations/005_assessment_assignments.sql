create table if not exists public.assessment_assignments (
  id text primary key default gen_random_uuid()::text,
  campaign_id text not null references public.assessment_campaigns(id) on delete cascade,
  person_id text not null references public.people(id) on delete cascade,
  instrument_code text not null,
  required boolean not null default true,
  assigned_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint assessment_assignments_status_check check (status in ('pending', 'in_progress', 'completed')),
  constraint assessment_assignments_instrument_check check (instrument_code in ('ema', 'baron', 'disc'))
);

create unique index if not exists assessment_assignments_unique_uidx
  on public.assessment_assignments (campaign_id, person_id, instrument_code);

create index if not exists assessment_assignments_person_idx
  on public.assessment_assignments (person_id, status);

create index if not exists assessment_assignments_campaign_idx
  on public.assessment_assignments (campaign_id, instrument_code, status);
