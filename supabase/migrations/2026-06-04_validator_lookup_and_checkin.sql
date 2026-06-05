-- =============================================================
-- Migration · 2026-06-04 · Entrance validator (QR scan endpoint)
--
-- Adds:
--   - profiles.checked_in_at       (when the staff scanned the QR)
--   - public.lookup_ticket(code)   (read attendee info by ticket code)
--   - public.check_in(code)        (mark check-in idempotently)
--
-- Privacy model: lookup_ticket is callable by the anon role because
-- the boarding-pass QR encodes a URL that the staff's phone camera
-- opens directly in the browser (no login). The ticket code itself
-- is the secret — 30^6 ≈ 729M combos make brute force impractical
-- against ~200 valid codes at conference scale, but assume a leaked
-- code reveals full attendee info to whoever holds it.
-- =============================================================

-- 1) check-in timestamp on profiles.
alter table public.profiles
  add column if not exists checked_in_at timestamptz;

-- 2) lookup_ticket(p_code) — single source for the validator page.
--    Returns the full attendee record + their Day 1 confirmed picks.
--    SECURITY DEFINER so it can read profiles + picks past RLS.
drop function if exists public.lookup_ticket(text);
create or replace function public.lookup_ticket(p_code text)
returns table (
  found          boolean,
  message        text,
  ticket_code    text,
  first_name     text,
  last_name      text,
  email          text,
  phone          text,
  institution    text,
  role           text,
  country        text,
  checked_in_at  timestamptz,
  picks          jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_picks   jsonb;
begin
  -- Normalize: uppercase + strip whitespace so case + casual paste forgive.
  p_code := upper(trim(p_code));

  if p_code is null or p_code = '' then
    return query select false, 'Empty code.'::text,
      null::text, null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  select * into v_profile from profiles where profiles.ticket_code = p_code;

  if not found then
    return query select false, 'Ticket code not found.'::text,
      p_code, null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  -- Pull confirmed picks joined with the session catalog.
  select coalesce(jsonb_agg(jsonb_build_object(
           'session_id', s.id,
           'block',      s.block,
           'title',      s.title,
           'speaker',    s.speaker,
           'room',       s.room
         ) order by s.starts_at), '[]'::jsonb)
    into v_picks
  from picks p
  join sessions s on s.id = p.session_id
  where p.user_id = v_profile.id
    and p.status = 'confirmed';

  return query select
    true, 'OK'::text,
    v_profile.ticket_code,
    v_profile.first_name, v_profile.last_name,
    v_profile.email, v_profile.phone,
    v_profile.institution, v_profile.role, v_profile.country,
    v_profile.checked_in_at,
    v_picks;
end;
$$;

-- 3) check_in(p_code) — idempotent. First call sets checked_in_at = now();
--    subsequent calls return the original timestamp so the UI can show
--    "Already checked in at HH:MM" instead of silently overwriting.
drop function if exists public.check_in(text);
create or replace function public.check_in(p_code text)
returns table (
  success         boolean,
  message         text,
  already         boolean,
  checked_in_at   timestamptz,
  first_name      text,
  last_name       text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  p_code := upper(trim(p_code));

  select * into v_profile from profiles where profiles.ticket_code = p_code;

  if not found then
    return query select false, 'Ticket code not found.'::text,
      false, null::timestamptz, null::text, null::text;
    return;
  end if;

  if v_profile.checked_in_at is not null then
    -- Idempotent: don't move the stamp, just report the existing one.
    return query select true,
      'Already checked in.'::text,
      true,
      v_profile.checked_in_at,
      v_profile.first_name,
      v_profile.last_name;
    return;
  end if;

  update profiles
     set checked_in_at = now()
   where id = v_profile.id
   returning checked_in_at into v_profile.checked_in_at;

  return query select true,
    'Checked in.'::text,
    false,
    v_profile.checked_in_at,
    v_profile.first_name,
    v_profile.last_name;
end;
$$;

-- 4) Grants. Both RPCs are called by the unauthenticated /v/{code}
--    page, so anon needs EXECUTE. authenticated inherits anon by default
--    but be explicit for clarity.
revoke execute on function public.lookup_ticket(text) from public;
grant  execute on function public.lookup_ticket(text) to anon, authenticated;

revoke execute on function public.check_in(text)      from public;
grant  execute on function public.check_in(text)      to anon, authenticated;
