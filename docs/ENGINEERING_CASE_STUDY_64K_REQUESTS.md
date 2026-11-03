# Engineering Case Study: Architecting Under Surge

### How We Handled 64,000+ Requests on Free-Tier Postgres with 99.7% Reliability

**Author:** Deviators Club Engineering Team  
**Platform:** [deviators.club](https://www.deviators.club)  
**Events Powered:** _Debug Decrypt 3.0_ & _Web Lumina 2026_  
**Stack:** Next.js 16 (App Router), React 19, Supabase, PostgreSQL 15, Vercel Serverless

---

## Executive Summary & Production Scorecard

Every software engineer knows the dread of launching an event platform. Unlike standard SaaS applications where traffic curves ramp up smoothly, collegiate tech events experience **instantaneous step-function load**. Hundreds of developers flood registration forms the minute announcements drop, and dozens of teams race to submit qualifications before closing windows.

For our flagship events at Deviators Club — **Debug Decrypt 3.0** (a multi-stage competitive programming, DSA, and algorithmic debugging sprint) and **Web Lumina 2026** (a high-craft web design & frontend challenge) — we set an audacious technical goal:

> **Can we build a full-featured multi-stage registration, team formation, and real-time qualification platform that handles high-concurrency traffic bursts with zero infrastructure budget?**

During the 24-hour peak window spanning the registration deadline and live Round 1 qualification:

| Metric                           | Measured Value        | Notes                                                      |
| :------------------------------- | :-------------------- | :--------------------------------------------------------- |
| **Total Backend Requests (24h)** | **64,686**            | Measured at the API Gateway layer                          |
| **System-Wide Success Rate**     | **99.7%**             | Only 0.3% non-2xx status codes                             |
| **API Gateway Requests**         | **45,381**            | **0 Errors**, 156 Warnings                                 |
| **Auth Verification Requests**   | **18,995**            | 35 Warnings, 4 Edge-case errors (99.98% reliability)       |
| **Direct Heavy Postgres Hits**   | **306**               | Read-caching & Gateway absorption prevented DB thrashing   |
| **Peak Concurrent Online Users** | **75 concurrent**     | Simultaneous users active in registration & quiz countdown |
| **Monthly Traffic Surge**        | **16,611 Page Views** | **+1,600% surge**, 2,633 unique visitors (+805%)           |
| **Bounce Rate**                  | **30% – 31%**         | Highly engaged developer audience                          |
| **Total Infrastructure Cost**    | **$0.00**             | Supabase Free Tier + Vercel Hobby Tier                     |

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer [Client & Edge Layer]
        User[Browser Client] -->|HTTPS / Next.js 16 App Router| CDN[Vercel Global Edge Network]
        CDN -->|SSR / Server Components| VercelFunc[Next.js Serverless Functions - BOM1 / IAD1]
    end

    subgraph GatewayLayer [Supabase API Gateway]
        VercelFunc -->|JWT Bearer Token / Session Cookies| KongGateway[Supabase Kong API Gateway]
        KongGateway -->|Auth & Token Validation| GoTrue[GoTrue Auth Service - 18.9k Reqs]
    end

    subgraph DataLayer [PostgreSQL 15 Engine]
        KongGateway -->|PostgREST RPC / Data Access| PostgresCore[(PostgreSQL Database)]

        subgraph EngineFeatures [Engine Optimizations]
            PostgresCore --> DeclarativeConstraints[Declarative Unique & Regex Constraints]
            PostgresCore --> SecDefiner[SECURITY DEFINER Helper Functions]
            PostgresCore --> FunctionalIndex[Functional B-Tree Indexes on lower(username)]
            PostgresCore --> RLS[Row-Level Security Policies]
        end
    end
```

The system was designed with strict layer separation:

1. **Next.js 16 Edge / Serverless:** Serves static visual shells instantly via CDN edge nodes, while API routes handle input normalization, token extraction, and orchestration.
2. **Supabase Kong API Gateway:** Absorbed **45,381 requests** directly, caching repetitive reads and validating JWT tokens before requests ever reached the SQL engine.
3. **PostgreSQL 15 Core:** The single source of truth for transactional state, concurrency serialization, and row-level authorization.

---

## 2. Deep Dive: Key Engineering Challenges & Solutions

### A. Concurrency Control: Pushing Locks to PostgreSQL

In team registration platforms, race conditions are rampant:

- A team leader invites a teammate who accepted another team's invite half a second earlier.
- Multiple teammates panic and click "Submit Registration" at the identical millisecond.
- Two users attempt to claim the exact same team name concurrently.

In distributed serverless environments (where API route instances execute across isolated containers in different regions like `bom1` and `iad1`), in-memory mutexes or Node.js locks cannot coordinate state.

Rather than trying to build complex distributed locks with external caching layers, we **delegated all concurrency serialization to PostgreSQL declarative constraints**:

```sql
-- 1. Atomic registration barrier: One registration per member per event
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
  constraint registrations_event_profile_uniq unique (event_id, profile_id)
);

-- Fast lookup indexes
create index if not exists registrations_profile_idx on public.registrations (profile_id);
create index if not exists registrations_event_idx on public.registrations (event_id);
```

#### Why this works:

When two parallel requests arrive for the same user, Postgres evaluates the `UNIQUE (event_id, profile_id)` composite constraint at the engine level. The first transaction commits; the second transaction triggers an immediate, non-blocking constraint violation abort. The API catches this error and returns a clean HTTP 400 response without leaving orphan records or partial team states.

---

### B. The Username Handling & Collation Regex Trap

Every member claims a unique alphanumeric handle used for their vanity URL (`/dashboard/@username`), public cards, and teammate autocomplete.

During development, we discovered a subtle database pitfall: under custom PostgreSQL database collations, standard character ranges in CHECK constraints can cause unexpected parsing errors. Specifically, `[9-_]` is an invalid range under certain collations, causing profile upsert mutations to fail under load.

We pinned the hyphen as a literal at the end of the character class and created a functional expression index for instant lookups:

```sql
-- Migration 002: Username CHECK regex & collation pinning
alter table public.profiles drop constraint if exists profiles_username_check;

alter table public.profiles
  add constraint profiles_username_check
  check (username ~ '^[a-z0-9_-]{3,30}$');

-- Functional B-Tree index for case-insensitive search
create index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
```

#### The Performance Impact:

During registration, users type `@teammate_handle` to build their teams. The frontend debounces searches every 150ms. Because the index is built directly on `lower(username)`, queries execute via index-only scans in **sub-4ms**, completely avoiding expensive `ILIKE` sequential table scans.

---

### C. Breaking Row-Level Security (RLS) Infinite Recursion

Row Level Security (RLS) enforces authorization at the database layer. However, relational models with mutual dependencies frequently run into **infinite recursion**:

1. To view a team in `teams`, Postgres checks if the user is in `team_members`.
2. To view a row in `team_members`, Postgres checks if the user is the leader in `teams`.
3. When both tables have RLS enabled, PostgreSQL executes:
   ```
   ERROR: infinite recursion detected in policy for relation "teams"
   ```

To solve this, we decoupled membership checks into a `SECURITY DEFINER` function with strict search path isolation:

```sql
create or replace function public.is_team_member(check_team_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and profile_id = check_user_id
  );
$$;

-- Clean, non-recursive RLS policy on teams:
create policy "team visible to members"
  on public.teams for select using (
    auth.uid() = leader_id
    or public.is_team_member(id, auth.uid())
  );
```

By marking the function `STABLE` and `SECURITY DEFINER`, PostgreSQL caches the execution plan and evaluates membership with trusted system privileges, completely bypassing the circular policy chain.

---

### D. Zero-PII Data Exposure via Stored Procedures

Every participant has a public member badge visible to the community. However, student profiles also store private information: phone numbers, college roll numbers, and personal emails.

Instead of relying on frontend code or backend serializers to strip sensitive fields (where a single forgotten object spread can leak thousands of phone numbers), we encapsulated the public projection inside an isolated SQL stored procedure:

```sql
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

-- Restrict access permissions
revoke all on function public.get_member_card(text) from public;
grant execute on function public.get_member_card(text) to anon, authenticated;
```

Anonymous visitors only have permission to execute `get_member_card(text)`. Direct read access to the underlying `profiles` table is strictly limited to authenticated members reading their own or peers' safe profile attributes.

---

## 3. The Serverless War Story: The Ephemeral Disk Reality Check

During production testing of the live Round 1 qualification system, our Vercel log exports captured a critical error pattern:

```json
{
  "requestPath": "www.deviators.club/api/round-1/save-response",
  "responseStatusCode": 200,
  "level": "error",
  "message": "[writeJsonFile error] Error: ENOENT: no such file or directory, open '/var/task/.data/quiz_responses.json'"
}
```

### The Root Cause:

In modern serverless environments (AWS Lambda / Vercel Functions), container runtimes are **strictly read-only and ephemeral**.
When code attempts to append autosave responses to a local file (`/var/task/.data/...`), it crashes because:

1. The filesystem is read-only.
2. Concurrent function invocations run across multiple distinct VMs and regions (`iad1` vs `bom1`). Local files are never synchronized across instances.

### The Fix: Relational State Engine with Atomic Upserts

We abandoned ephemeral file-based logging and migrated Round 1 state tracking directly into PostgreSQL tables with fine-grained compound keys:

```sql
-- Migration 007: Round 1 Quiz System
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  round_slug text not null default 'round-1',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz default null,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'terminated')),
  strike_count int not null default 0,
  shuffled_order jsonb not null default '[]'::jsonb,
  score numeric not null default 0,
  max_score numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint quiz_sessions_user_round_uniq unique (user_id, round_slug)
);

create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  selected_answers jsonb default null,
  is_flagged boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint quiz_responses_session_question_uniq unique (session_id, question_id)
);
```

### Benefits of the Database-Backed Engine:

- **Zero Data Loss:** Every selected option autosaved every 2 seconds via an atomic upsert targeting `(session_id, question_id)`.
- **Session Recovery:** If a participant experienced a Wi-Fi disconnect or accidentally closed their tab, reopening the test restored their exact state, answers, and remaining countdown timer in under 30ms.
- **Server-Side Proctoring:** The `expires_at` timestamp was anchored to server clock time, making it impossible to tamper with client-side JavaScript timers.

---

## 4. Key Engineering Takeaways

### 1. You Don't Need Microservices to Scale

There is a common industry misconception that handling tens of thousands of requests requires microservices, Kafka pipelines, and Redis clusters. In reality, a modern PostgreSQL instance with clean B-Tree indexes, thoughtful constraints, and connection pooling can easily absorb 100,000+ requests on minimal hardware.

### 2. Push Consistency to the Database

Handling race conditions in distributed application code (Node.js/Python) requires distributed locks that introduce latency and complexity. PostgreSQL's transactional guarantees and unique constraints solve race conditions out of the box with zero runtime overhead.

### 3. Functional Indexes Are High-ROI

If users search or authenticate by case-insensitive identifiers, creating a functional index (`CREATE INDEX ON table (lower(column))`) eliminates full-table scans and keeps database CPU utilization near zero.

### 4. Build for Ephemeral Runtimes from Day One

Never store temporary state or log fallbacks on local disk in serverless applications. Treat every function invocation as stateless, and channel all durable state through your database engine.

---

## Conclusion

Scaling the **Deviators Club** platform to handle **64,686 requests** with **99.7% uptime** during live event deadlines was a masterclass in pragmatic, defensive engineering. By mastering PostgreSQL primitives, designing resilient data schemas, and respecting the constraints of serverless runtimes, we delivered a fast, reliable, and secure experience for hundreds of student developers.

_Built with passion by the Deviators Club Engineering Team._
