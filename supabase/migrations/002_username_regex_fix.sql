-- Fix username CHECK regex: `9-_` is an invalid character range under the
-- database collation, so every profile upsert fails. The trailing hyphen
-- below is a literal hyphen, valid under any collation.
-- Run once in SQL Editor.

alter table public.profiles drop constraint if exists profiles_username_check;

alter table public.profiles
  add constraint profiles_username_check
  check (username ~ '^[a-z0-9_-]{3,30}$');
