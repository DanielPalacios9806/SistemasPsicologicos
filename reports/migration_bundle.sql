-- FILE: 001_baseline_documented.sql
-- Baseline documented from supabase/schema.sql.
-- This migration is intentionally non-destructive and repeatable.
-- It preserves the legacy survey_submissions table and the modern
-- people/applications/responses/partial_results/final_results model.

create extension if not exists pgcrypto;

create table if not exists public.survey_submissions (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  id_number text not null unique,
  full_name text not null,
  career text not null,
  age text not null,
  gender text not null,
  email text,
  google_id text,
  picture text,
  participant jsonb not null,
  answers jsonb not null,
  scoring jsonb not null
);

create index if not exists survey_submissions_created_at_idx
  on public.survey_submissions (created_at desc);

create index if not exists survey_submissions_career_idx
  on public.survey_submissions (career);

create table if not exists public.people (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default timezone('utc', now()),
  id_number text not null unique,
  full_name text not null,
  age text not null,
  gender text not null,
  career text not null,
  email text,
  google_id text,
  picture text
);

create table if not exists public.applications (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  person_id text not null references public.people(id) on delete cascade,
  instrument_code text not null,
  instrument_name text not null,
  instrument_version text not null,
  status text not null,
  current_module_key text,
  percentage_complete numeric(5,2) not null default 0,
  valid boolean,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  participant_snapshot jsonb,
  scoring_snapshot jsonb
);

create index if not exists applications_person_idx
  on public.applications (person_id, instrument_code, started_at desc);

create index if not exists applications_status_idx
  on public.applications (status, instrument_code);

create table if not exists public.responses (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  application_id text not null references public.applications(id) on delete cascade,
  item_id integer not null,
  response integer not null,
  adjusted_response integer,
  module_key text,
  component_key text,
  subcomponent_keys jsonb default '[]'::jsonb
);

create unique index if not exists responses_application_item_uidx
  on public.responses (application_id, item_id);

create table if not exists public.partial_results (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  application_id text not null references public.applications(id) on delete cascade,
  scope_type text not null,
  scope_key text not null,
  scope_label text not null,
  raw_score numeric,
  normalized_score numeric,
  category text,
  completion_ratio numeric,
  detail_json jsonb
);

create index if not exists partial_results_application_idx
  on public.partial_results (application_id, scope_type, scope_key);

create table if not exists public.final_results (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  application_id text not null unique references public.applications(id) on delete cascade,
  total_raw numeric,
  total_normalized numeric,
  profile_global text,
  valid boolean,
  interpretation_json jsonb,
  detail_json jsonb
);


-- FILE: 002_personnel_profiles.sql
create table if not exists public.personnel_profiles (
  person_id text primary key references public.people(id) on delete cascade,
  unit_code text,
  rank_code text not null,
  promotion integer,
  specialty_code text,
  description text,
  sex text,
  classification text,
  source text not null default 'ESCALAFON_2026',
  source_updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists personnel_profiles_rank_idx
  on public.personnel_profiles (rank_code, promotion);

create index if not exists personnel_profiles_unit_idx
  on public.personnel_profiles (unit_code);


-- FILE: 003_user_accounts.sql
create table if not exists public.user_accounts (
  id text primary key default gen_random_uuid()::text,
  person_id text unique references public.people(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  password_salt text not null,
  password_algorithm text not null default 'scrypt-v1',
  role text not null default 'participant',
  active boolean not null default true,
  must_change_password boolean not null default true,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz,
  token_version integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_accounts_role_check check (role in ('participant', 'admin'))
);

create index if not exists user_accounts_person_idx
  on public.user_accounts (person_id);

create index if not exists user_accounts_active_idx
  on public.user_accounts (active, role);


-- FILE: 004_assessment_campaigns.sql
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


-- FILE: 005_assessment_assignments.sql
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


-- FILE: 006_disc_support.sql
-- DISC support is represented through instrument_code='disc' in the existing
-- applications/responses/partial_results/final_results model. This migration
-- only records a versionable catalog row for future manual/version changes.

create table if not exists public.instrument_versions (
  id text primary key default gen_random_uuid()::text,
  instrument_code text not null,
  version text not null,
  name text not null,
  manual_reference text,
  active boolean not null default true,
  definition_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists instrument_versions_code_version_uidx
  on public.instrument_versions (instrument_code, version);

insert into public.instrument_versions (instrument_code, version, name, manual_reference, active)
values
  ('ema', 'EMA 45 reactivos', 'Escala Multidimensional de Asertividad', 'Aplicacion existente', true),
  ('baron', 'ICE-JA adultos y jovenes adultos', 'BarOn ICE', 'Aplicacion existente', true),
  ('disc', 'DISC v1 manual suministrado', 'DISC Sistema de Perfil Personal', '133997765-Manual-Disc.pdf; disc-sistema-de-perfil-personal-instrucciones-y-ejemplos-en-espanol.pdf', true)
on conflict (instrument_code, version) do nothing;


-- FILE: 007_security_rls.sql
-- Privacy-first RLS. The Node backend uses SUPABASE_SERVICE_ROLE_KEY and
-- bypasses RLS. Browser clients must not read these tables directly.

alter table public.survey_submissions enable row level security;
alter table public.people enable row level security;
alter table public.applications enable row level security;
alter table public.responses enable row level security;
alter table public.partial_results enable row level security;
alter table public.final_results enable row level security;
alter table public.personnel_profiles enable row level security;
alter table public.user_accounts enable row level security;
alter table public.assessment_campaigns enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.instrument_versions enable row level security;

revoke all on public.survey_submissions from anon, authenticated;
revoke all on public.people from anon, authenticated;
revoke all on public.applications from anon, authenticated;
revoke all on public.responses from anon, authenticated;
revoke all on public.partial_results from anon, authenticated;
revoke all on public.final_results from anon, authenticated;
revoke all on public.personnel_profiles from anon, authenticated;
revoke all on public.user_accounts from anon, authenticated;
revoke all on public.assessment_campaigns from anon, authenticated;
revoke all on public.assessment_assignments from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.instrument_versions to anon, authenticated;

drop policy if exists instrument_versions_public_read on public.instrument_versions;
create policy instrument_versions_public_read
  on public.instrument_versions
  for select
  to anon, authenticated
  using (active = true);

