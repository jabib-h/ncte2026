-- =============================================================
-- NCTE 2026 — Seed data for the pickable Day 1 concurrent sessions
-- Run this AFTER schema.sql, in the SQL Editor.
-- IDs match the data-id attributes on registro-presencial.html cards.
-- Capacity/taken values reflect the demo numbers currently shown.
-- =============================================================

insert into public.sessions
  (id, day, block, starts_at, duration_min, title, speaker, speaker_initials,
   speaker_country, room, strand, format, capacity, taken)
values
  -- ====== MORNING CONCURRENTS (Day 1 · 11:00 am) ======
  ('mondragon-ai', 1, 'morning', '2026-07-08 17:00:00+00', 90,
   'AI in Action: Everyday Tools and Classroom Ideas for Busy Teachers',
   'Junuen Mondragón', 'JM', 'Nat Geo Learning · 🇲🇽 Mexico',
   'Room A · 30 seats', 'best-practices', 'presencial', 30, 8),   -- 22 left

  ('leegopalan', 1, 'morning', '2026-07-08 17:00:00+00', 90,
   'Education Needs Infrastructure, Not Apps',
   'Jay Lee-Gopalan', 'JLG', 'Jinso',
   'Room B · 30 seats', 'moving-forward', 'presencial', 30, 4),   -- 26 left

  ('viquez', 1, 'morning', '2026-07-08 17:00:00+00', 90,
   'Adding Emotion to an AI Assisted Learning Experience',
   'Oscar Víquez', 'OV', 'Universidad Latina · 🇨🇷 Costa Rica',
   'Room C · 30 seats', 'inclusive', 'presencial', 30, 1),        -- 29 left

  -- ====== AFTERNOON CONCURRENTS (Day 1 · 4:00 pm) ======
  ('cormier-torres', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Designing Communicative Listening Tasks with AI Support',
   'Mark Cormier & Pablo Torres', 'MC', 'CCCN · 🇨🇷 Costa Rica · Bring laptop',
   'Workshop room · 25 seats', 'best-practices', 'presencial', 25, 18), -- 7 left

  ('vaglio', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'From Information to Inspiration: The New Mission of ELT Teachers',
   'Marcela Vaglio', 'MV', 'Pearson · 🇨🇷 Costa Rica',
   'Room B · 30 seats', 'assessment', 'presencial', 30, 12),      -- 18 left

  ('acuna', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'From Reflection to Action: Designing Meaningful Learning Experiences in ELT',
   'Jonathan Acuña', 'JA', 'CCCN · 🇨🇷 Costa Rica',
   'Room C · 30 seats', 'moving-forward', 'presencial', 30, 5),   -- 25 left

  ('rivera', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Supporting English Language Professionals: Resources from the U.S. Embassy Panama''s Regional English Language Office',
   'Juan Carlos Rivera', 'JCR', 'U.S. Embassy Panama · 🇵🇦 Panama',
   'Room D · 30 seats', 'best-practices', 'presencial', 30, 21);  -- 9 left
