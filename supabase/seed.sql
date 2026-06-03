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
  ('acuna',     1, 'morning',   '2026-07-08 17:00:00+00', 90,
   'Teacher reflection supported by AI',
   'Jonathan Acuña', 'JA', '🇨🇷 Costa Rica',
   'Room A · 30 seats', 'moving-forward', 'presencial', 30, 18),  -- 12 left

  ('m-room-b',  1, 'morning',   '2026-07-08 17:00:00+00', 90,
   'Building rubrics with AI for B1 writing',
   'Diana Salas', 'DS', '🇨🇷 Costa Rica',
   'Room B · 30 seats', 'assessment', 'presencial', 30, 8),       -- 22 left

  ('m-room-c',  1, 'morning',   '2026-07-08 17:00:00+00', 90,
   'Storytelling and SEL in the young learners classroom',
   'Andrea Rojas', 'AR', '🇨🇷 Costa Rica',
   'Room C · 30 seats', 'young-learners', 'presencial', 30, 26),  -- 4 left

  ('m-room-d',  1, 'morning',   '2026-07-08 17:00:00+00', 90,
   'UDL for the multilevel English classroom',
   'Carlos Méndez', 'CM', '🇨🇷 Costa Rica',
   'Room D · 30 seats', 'inclusive', 'presencial', 30, 30),       -- FULL

  -- ====== AFTERNOON CONCURRENTS (Day 1 · 4:00 pm) ======
  ('cormier-torres', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Designing Communicative Listening Tasks with AI Support',
   'Mark Cormier & Pablo Torres', 'MC', 'CCCN · 🇨🇷 Costa Rica · Bring laptop',
   'Workshop room · 25 seats', 'best-practices', 'presencial', 25, 18), -- 7 left

  ('vaglio',    1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Rethinking assessment in the age of AI',
   'Marcela Vaglio', 'MV', '🇨🇷 Costa Rica',
   'Room B · 30 seats', 'assessment', 'presencial', 30, 12),       -- 18 left

  ('a-room-c',  1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Voice-first activities for the speaking classroom',
   'Sofia Cordero', 'SC', '🇨🇷 Costa Rica',
   'Room C · 30 seats', 'best-practices', 'presencial', 30, 5),    -- 25 left

  ('a-room-d',  1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Co-creating materials with AI: ethics & quality',
   'Laura Quirós', 'LQ', '🇨🇷 Costa Rica',
   'Room D · 30 seats', 'moving-forward', 'presencial', 30, 21);   -- 9 left
