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
