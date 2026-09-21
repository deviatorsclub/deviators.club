-- Allow 'Passout' as a year value.
-- Run once in SQL Editor.

alter table public.profiles drop constraint if exists profiles_year_check;

alter table public.profiles
  add constraint profiles_year_check
  check (year in ('', 'Fresher', '2nd Year', '3rd Year', '4th Year', 'Passout'));
