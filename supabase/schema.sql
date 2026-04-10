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

comment on table public.survey_submissions is
  'Registros de la aplicacion de evaluacion orientativa de asertividad para estudiantes.';

comment on column public.survey_submissions.id_number is
  'Cedula unica del encuestado. Se usa para evitar respuestas duplicadas y para consulta administrativa.';
