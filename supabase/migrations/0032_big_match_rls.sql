-- W13 · Big-Match RLS
-- match_requests existiert seit 0009/0018/0019 ohne RLS.
-- Defense-in-Depth fuer Match-Daten (Creator-PII, opponent_strength,
-- desired_at).
-- Idempotent.

alter table match_requests enable row level security;

-- Creator: own-read, own-insert, own-update (Cancel etc.)
drop policy if exists mr_own_read on match_requests;
create policy mr_own_read on match_requests for select
  using (profile_id = auth.uid());

drop policy if exists mr_own_insert on match_requests;
create policy mr_own_insert on match_requests for insert
  with check (profile_id = auth.uid());

drop policy if exists mr_own_update on match_requests;
create policy mr_own_update on match_requests for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Manager: read fuer eigene Creator
drop policy if exists mr_manager_read on match_requests;
create policy mr_manager_read on match_requests for select
  using (
    exists (
      select 1 from profiles p
      where p.id = match_requests.profile_id
        and p.manager_id = auth.uid()
    )
  );

-- Admin: full CRUD
drop policy if exists mr_admin_all on match_requests;
create policy mr_admin_all on match_requests for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

notify pgrst, 'reload schema';
