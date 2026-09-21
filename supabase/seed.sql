-- Seed data: club roles. Events are created via SQL or a future admin UI.
-- Run after schema.sql in SQL Editor.

insert into public.roles (tag, label, tone) values
  ('member', 'Member', 'bg-white/[0.06] text-white/70 border-white/10'),
  ('web-lead', 'Web Lead', 'bg-blue-500/10 text-blue-300 border-blue-500/20'),
  ('chief-coordinator', 'Chief Coordinator', 'bg-amber-500/10 text-amber-300 border-amber-500/20'),
  ('president', 'President', 'bg-amber-400/10 text-amber-300 border-amber-400/25'),
  ('ex-club', 'Ex-Club', 'bg-white/[0.04] text-white/50 border-white/10')
on conflict (tag) do update
  set label = excluded.label, tone = excluded.tone;
