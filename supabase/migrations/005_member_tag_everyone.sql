-- Every member carries the 'member' tag. Backfills existing profiles and
-- lets users claim it themselves going forward (admins still own the rest).
-- Run once in SQL Editor.

insert into public.profile_roles (profile_id, tag)
select id, 'member' from public.profiles
on conflict do nothing;

drop policy if exists "users claim member tag" on public.profile_roles;
create policy "users claim member tag"
  on public.profile_roles for insert
  with check (auth.uid() = profile_id and tag = 'member');
