-- Migration for databases created before the Branch field.
-- Run once in SQL Editor AFTER supabase/schema.sql was already applied.
-- (Fresh databases: just run schema.sql, skip this file.)

alter table public.profiles rename column college to branch;

-- normalize any old free-text values to the allowed set
update public.profiles
set branch = ''
where branch not in ('', 'CSE', 'AIML', 'ECE', 'IoT', 'ECS', 'ME/RA');

alter table public.profiles
  add constraint profiles_branch_check
  check (branch in ('', 'CSE', 'AIML', 'ECE', 'IoT', 'ECS', 'ME/RA'));
