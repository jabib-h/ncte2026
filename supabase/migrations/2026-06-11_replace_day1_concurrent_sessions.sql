-- =============================================================
-- Replace Day 1 concurrent sessions per the final NCTE 2026 schedule
-- (Excel "NCTE 2026 - SCHEDULE", confirmed 2026-06-11).
--
-- Morning block (11:00 am): 4 rooms -> 3 (mondragon-ai, leegopalan, viquez).
-- Afternoon block (4:00 pm): 4 rooms -> 4. 'acuna' moves from morning to
-- afternoon with a new title; 'rivera' is new. 'cormier-torres' is unchanged
-- (front-end photos only). 'vaglio' keeps its id/strand but gets a new title.
--
-- Real picks existed for the rooms being removed/recreated
-- (m-room-b, m-room-c, m-room-d, a-room-c, a-room-d, old 'acuna'); those
-- picks are deleted along with the sessions per a deliberate decision to
-- clear stale demo reservations rather than carry them forward.
-- =============================================================

-- 1. Drop picks tied to sessions being removed or recreated with a new identity.
delete from public.picks
where session_id in ('m-room-b', 'm-room-c', 'm-room-d', 'a-room-c', 'a-room-d', 'acuna');

-- 2. Drop the old session rows (including old 'acuna', recreated below with new content).
delete from public.sessions
where id in ('m-room-b', 'm-room-c', 'm-room-d', 'a-room-c', 'a-room-d', 'acuna');

-- 3. Update 'vaglio' title in place (kept id/strand, real picks reference it).
update public.sessions
set title = 'From Information to Inspiration: The New Mission of ELT Teachers',
    updated_at = now()
where id = 'vaglio';

-- 4. Insert the new/recreated sessions.
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
  ('acuna', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'From Reflection to Action: Designing Meaningful Learning Experiences in ELT',
   'Jonathan Acuña', 'JA', 'CCCN · 🇨🇷 Costa Rica',
   'Room C · 30 seats', 'moving-forward', 'presencial', 30, 5),   -- 25 left

  ('rivera', 1, 'afternoon', '2026-07-08 22:00:00+00', 90,
   'Supporting English Language Professionals: Resources from the U.S. Embassy Panama''s Regional English Language Office',
   'Juan Carlos Rivera', 'JCR', 'U.S. Embassy Panama · 🇵🇦 Panama',
   'Room D · 30 seats', 'best-practices', 'presencial', 30, 21);  -- 9 left
