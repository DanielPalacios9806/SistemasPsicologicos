-- Additive staff authorization model. Existing accounts and assessment data are preserved.

begin;

alter table public.user_accounts
  drop constraint if exists user_accounts_role_check;

alter table public.user_accounts
  add constraint user_accounts_role_check
  check (role in ('participant', 'admin', 'psychologist'));

create table if not exists public.staff_campaign_access (
  id text primary key default gen_random_uuid()::text,
  account_id text not null references public.user_accounts(id) on delete cascade,
  campaign_id text not null references public.assessment_campaigns(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint staff_campaign_access_unique unique (account_id, campaign_id)
);

create index if not exists staff_campaign_access_account_idx
  on public.staff_campaign_access (account_id);

create table if not exists public.audit_events (
  id text primary key default gen_random_uuid()::text,
  account_id text references public.user_accounts(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id text,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_events_account_created_idx
  on public.audit_events (account_id, created_at desc);

create index if not exists audit_events_type_created_idx
  on public.audit_events (event_type, created_at desc);

alter table public.staff_campaign_access enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.staff_campaign_access from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;

commit;
