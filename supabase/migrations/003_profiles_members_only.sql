-- Restrict the member directory to signed-in users so profile emails
-- are not publicly readable. The app only queries profiles when logged in.
-- Run once in SQL Editor.

drop policy if exists "profiles readable by all" on public.profiles;
drop policy if exists "profiles readable by members" on public.profiles;

create policy "profiles readable by members"
  on public.profiles for select using (auth.role() = 'authenticated');
