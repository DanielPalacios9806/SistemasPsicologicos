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
