-- Deviators Club dashboard backend (Supabase / Postgres)
-- Run this once in Supabase Dashboard → SQL Editor → New query.
-- Free-tier friendly: no storage buckets, avatar_url is text only
-- (GitHub/Google CDN URLs), tiny rows, RLS on everything.

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text not null default '',
  bio text not null default '' check (char_length(bio) <= 120),
  pronouns text not null default '' check (char_length(pronouns) <= 30),
  location text not null default '',
  branch text not null default '' check (branch in ('', 'CSE', 'AIML', 'ECE', 'IoT', 'ECS', 'ME/RA')),
  year text not null default '' check (year in ('', 'Fresher', '2nd Year', '3rd Year', '4th Year', 'Passout')),
  avatar_url text not null default '',
  provider text not null default 'email',
  github_url text not null default '',
  linkedin_url text not null default '',
  website text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- case-insensitive username lookup for the member search
create index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- ── roles / tags (admin-assigned only) ──────────────────────
create table if not exists public.roles (
  tag text primary key,
  label text not null,
  tone text not null default 'bg-white/[0.06] text-white/70 border-white/10'
);

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tag text not null references public.roles (tag) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (profile_id, tag)
);

-- ── events ──────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tagline text not null default '',
  venue text not null default '',
  mode text not null default 'Offline',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reg_closes_at timestamptz not null,
  max_team_size int not null default 1 check (max_team_size between 1 and 6),
  is_team_event boolean not null default false,
  seats int not null default 100 check (seats > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── teams + members (invite by username, accept in dashboard)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  leader_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  primary key (team_id, profile_id)
);

-- ── registrations ───────────────────────────────────────────
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  phone text not null default '',
  college_id text not null default '',
  year text not null default '',
  expectations text not null default '',
  status text not null default 'confirmed' check (status in ('confirmed', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index if not exists registrations_profile_idx
  on public.registrations (profile_id);
create index if not exists registrations_event_idx
  on public.registrations (event_id);

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.registrations enable row level security;

-- profiles: signed-in members can read (directory + username search),
-- owners can insert/update their own row. Emails stay off the public internet.
drop policy if exists "profiles readable by all" on public.profiles;
drop policy if exists "profiles readable by members" on public.profiles;
create policy "profiles readable by members"
  on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- roles: readable by all, writable by service role only (admin script)
drop policy if exists "roles readable by all" on public.roles;
create policy "roles readable by all"
  on public.roles for select using (true);

drop policy if exists "roles readable by all" on public.profile_roles;
create policy "roles readable by all"
  on public.profile_roles for select using (true);

-- every member may claim the 'member' tag for themselves (nothing else)
drop policy if exists "users claim member tag" on public.profile_roles;
create policy "users claim member tag"
  on public.profile_roles for insert
  with check (auth.uid() = profile_id and tag = 'member');

-- events: published events readable by all
drop policy if exists "published events readable" on public.events;
create policy "published events readable"
  on public.events for select using (is_published = true);

-- teams: readable by members of the team + leader; leader creates
drop policy if exists "team visible to members" on public.teams;
create policy "team visible to members"
  on public.teams for select using (
    auth.uid() = leader_id
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.profile_id = auth.uid()
    )
  );

drop policy if exists "leader creates team" on public.teams;
create policy "leader creates team"
  on public.teams for insert with check (auth.uid() = leader_id);

-- team_members: visible to team members; leader adds rows
drop policy if exists "members visible to team" on public.team_members;
create policy "members visible to team"
  on public.team_members for select using (
    auth.uid() = profile_id
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and (t.leader_id = auth.uid() or exists (
          select 1 from public.team_members tm2
          where tm2.team_id = t.id and tm2.profile_id = auth.uid()
        ))
    )
  );

drop policy if exists "invitee updates own status" on public.team_members;
create policy "invitee updates own status"
  on public.team_members for update using (auth.uid() = profile_id);

-- registrations: owners manage their own; anyone reads counts via count()
drop policy if exists "users manage own registrations" on public.registrations;
create policy "users manage own registrations"
  on public.registrations for all using (auth.uid() = profile_id);

-- ── Public badge cards ──────────────────────────────────────
-- SECURITY DEFINER so anonymous visitors can read safe profile fields
-- (never emails) for /dashboard/@username pages. Revoke-and-recreate
-- keeps it idempotent across deploys.
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
