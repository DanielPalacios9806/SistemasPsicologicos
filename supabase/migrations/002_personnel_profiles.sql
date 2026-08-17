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
