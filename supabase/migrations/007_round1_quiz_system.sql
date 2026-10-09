-- 007_round1_quiz_system.sql
-- Proctoring and Quiz Shortlisting Engine for Deviators Club (Debug Decrypt 3.0)

-- 1. Master Question Bank (Server-protected)
create table if not exists public.quiz_questions (
  id text primary key,
  round_slug text not null default 'round-1',
  type text not null check (type in ('single_choice', 'multiple_choice', 'short_answer')),
  title text not null,
  description text not null default '',
  code_snippet text default null,
  options jsonb default '[]'::jsonb, -- [{"id": "a", "text": "Option A"}, ...]
  correct_answer jsonb not null,     -- protected, stripped before sending to client
  points int not null default 1,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_round_idx on public.quiz_questions (round_slug, order_index);

-- 2. Candidate Quiz Sessions (Single source of truth for timer & anti-cheat strikes)
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  round_slug text not null default 'round-1',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null, -- started_at + interval '60 minutes'
  submitted_at timestamptz default null,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'terminated')),
  termination_reason text default null,
  strike_count int not null default 0,
  shuffled_order jsonb not null default '[]'::jsonb, -- array of question IDs in randomized sequence
  score numeric not null default 0,
  max_score numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint quiz_sessions_user_round_uniq unique (user_id, round_slug)
);

create index if not exists quiz_sessions_user_round_idx on public.quiz_sessions (user_id, round_slug);

-- 3. Individual Responses (Real-time autosave)
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  selected_answers jsonb default null, -- ["a"] or ["a", "c"] or "custom_text"
  is_flagged boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint quiz_responses_session_question_uniq unique (session_id, question_id)
);

create index if not exists quiz_responses_session_idx on public.quiz_responses (session_id);

-- Row Level Security (RLS)
alter table public.quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_responses enable row level security;

-- Policies for sessions: Users can view their own session
create policy "Users view own quiz session"
  on public.quiz_sessions for select
  using (auth.uid() = user_id);

-- Policies for responses: Users can view & update their own responses
create policy "Users manage own quiz responses"
  on public.quiz_responses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
