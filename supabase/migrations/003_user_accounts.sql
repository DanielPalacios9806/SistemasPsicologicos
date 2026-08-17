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
