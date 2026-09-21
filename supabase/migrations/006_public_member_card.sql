-- Public badge cards for /dashboard/@username.
-- SECURITY DEFINER so anonymous visitors can read safe profile fields
-- (never emails). Run once in SQL Editor.

drop function if exists public.get_member_card(text);

create function public.get_member_card(p_username text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'username', p.username,
    'display_name', p.display_name,
    'bio', p.bio,
    'pronouns', p.pronouns,
    'location', p.location,
    'branch', p.branch,
    'year', p.year,
    'avatar_url', p.avatar_url,
    'github_url', p.github_url,
    'linkedin_url', p.linkedin_url,
    'website', p.website,
    'created_at', p.created_at,
    'tags', coalesce((
      select jsonb_agg(
        jsonb_build_object('tag', r.tag, 'label', r.label, 'tone', r.tone)
        order by r.label
      )
      from public.profile_roles pr
      join public.roles r on r.tag = pr.tag
      where pr.profile_id = p.id
    ), '[]'::jsonb)
  )
  from public.profiles p
  where lower(p.username) = lower(p_username)
    and p.onboarded = true
  limit 1;
$$;

revoke all on function public.get_member_card(text) from public;
grant execute on function public.get_member_card(text) to anon, authenticated;
