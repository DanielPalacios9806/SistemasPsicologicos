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
