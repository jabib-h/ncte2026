-- =============================================================
-- NCTE 2026 — Database schema
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run during development.
-- =============================================================

-- --- Clean slate when re-running -----------------------------
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.reserve_session(text);
drop function if exists public.cancel_pick(text);
drop table    if exists public.picks    cascade;
drop table    if exists public.sessions cascade;
drop table    if exists public.profiles cascade;

-- =============================================================
-- 1. profiles — 1:1 mirror of auth.users with the conference fields
-- =============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  first_name  text not null,
  last_name   text not null,
  phone       text not null,
  institution text not null,
  role        text not null check (role in ('teacher','coordinator','trainee','student','other')),
  country     text not null default 'CR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));

-- Trigger: when a new auth user is created, populate the profile row from
-- the metadata fields sent during signUp() — first_name, phone, etc.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, institution, role, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',  ''),
    coalesce(new.raw_user_meta_data->>'last_name',   ''),
    coalesce(new.raw_user_meta_data->>'phone',       ''),
    coalesce(new.raw_user_meta_data->>'institution', ''),
    coalesce(new.raw_user_meta_data->>'role',        'other'),
    coalesce(new.raw_user_meta_data->>'country',     'CR')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: only the owner can read or update their own profile row.
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =============================================================
-- 2. sessions — master catalog of pickable Day 1 concurrent sessions
-- =============================================================
create table public.sessions (
  id           text primary key,           -- matches the data-id in the HTML cards
  day          int  not null check (day in (1, 2)),
  block        text not null,              -- 'morning' or 'afternoon' for the planner; webinar id otherwise
  starts_at    timestamptz,                -- local kickoff time, useful for "X minutes before / after"
  duration_min int not null default 90,
  title        text not null,
  speaker      text,
  speaker_initials text,
  speaker_country  text,
  room         text,                       -- 'Room A', 'Workshop room', etc.
  strand       text,                       -- 'best-practices', 'assessment', 'moving-forward', etc.
  format       text not null check (format in ('presencial','virtual')),
  capacity     int  not null check (capacity > 0),
  taken        int  not null default 0 check (taken >= 0 and taken <= capacity),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index sessions_block_idx on public.sessions (block) where active = true;

-- RLS: anyone (even logged-out visitors) can read the catalog so the
-- planner page works before sign-in. No client-side writes — admins
-- update via the service role only.
alter table public.sessions enable row level security;

create policy "sessions_public_read"
  on public.sessions for select
  using (true);

-- =============================================================
-- 3. picks — one row per active reservation per user
-- =============================================================
create table public.picks (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  session_id   text not null references public.sessions(id),
  status       text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at   timestamptz not null default now(),
  cancelled_at timestamptz
);

create index picks_user_active_idx on public.picks (user_id) where status = 'confirmed';
create index picks_session_active_idx on public.picks (session_id) where status = 'confirmed';

-- One confirmed pick per user per session, ever.
-- (If a user cancels and re-reserves, we update existing row rather than
--  inserting a duplicate — handled inside reserve_session().)
create unique index picks_user_session_confirmed
  on public.picks (user_id, session_id) where status = 'confirmed';

alter table public.picks enable row level security;

-- Users can read their own picks. They can't insert/update directly —
-- all writes go through the SECURITY DEFINER functions below so the
-- capacity counter stays consistent.
create policy "picks_select_own"
  on public.picks for select
  using (auth.uid() = user_id);

-- =============================================================
-- 4. reserve_session — atomic check + insert
-- Handles "change of mind within the same block":
--   - releases the user's existing pick for this block (if any)
--   - reserves the new session
-- All in one transaction, locking the target session row to prevent
-- two attendees from grabbing the last seat at the same time.
-- =============================================================
create or replace function public.reserve_session(p_session_id text)
returns table(success boolean, message text, seats_left int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_session  sessions%rowtype;
  v_old      record;
  -- Reservations close at midnight CR (UTC-6) before Day 1.
  v_deadline constant timestamptz := '2026-07-08 00:00:00-06';
begin
  if v_user_id is null then
    return query select false, 'You must be signed in.'::text, 0;
    return;
  end if;

  if now() >= v_deadline then
    return query select false, 'Reservations are closed for Day 1.'::text, 0;
    return;
  end if;

  -- Lock the target session row so two concurrent requests can't both
  -- pass the capacity check.
  select * into v_session
  from sessions
  where id = p_session_id and active = true
  for update;

  if not found then
    return query select false, 'Session not found.'::text, 0;
    return;
  end if;

  if v_session.taken >= v_session.capacity then
    return query select false, 'This session is full.'::text, 0;
    return;
  end if;

  -- Does the user already have a confirmed pick in this same block?
  -- If so, this call is a "change" — release the old one first.
  select p.id as pick_id, p.session_id as old_session_id
    into v_old
  from picks p
  join sessions s on s.id = p.session_id
  where p.user_id = v_user_id
    and s.block = v_session.block
    and p.status = 'confirmed';

  if found then
    -- Clicking the same card twice = no-op (don't double-decrement).
    if v_old.old_session_id = p_session_id then
      return query select false, 'You are already registered for this session.'::text,
                          v_session.capacity - v_session.taken;
      return;
    end if;

    -- Release the previous pick and free its seat.
    update picks
       set status = 'cancelled', cancelled_at = now()
     where id = v_old.pick_id;

    update sessions
       set taken = greatest(0, taken - 1), updated_at = now()
     where id = v_old.old_session_id;
  end if;

  -- Insert the new reservation. If the user has a cancelled row for this
  -- same session, reactivate it instead of inserting a duplicate.
  update picks
     set status = 'confirmed', cancelled_at = null
   where user_id = v_user_id and session_id = p_session_id and status = 'cancelled';

  if not found then
    insert into picks(user_id, session_id, status)
         values (v_user_id, p_session_id, 'confirmed');
  end if;

  update sessions
     set taken = taken + 1, updated_at = now()
   where id = p_session_id;

  return query select true, 'Reserved.'::text, v_session.capacity - v_session.taken - 1;
end;
$$;

revoke all on function public.reserve_session(text) from public;
grant execute on function public.reserve_session(text) to authenticated;

-- =============================================================
-- 5. cancel_pick — release a seat without picking a replacement
-- =============================================================
create or replace function public.cancel_pick(p_session_id text)
returns table(success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_deadline constant timestamptz := '2026-07-08 00:00:00-06';
  v_found    boolean;
begin
  if v_user_id is null then
    return query select false, 'You must be signed in.'::text;
    return;
  end if;

  if now() >= v_deadline then
    return query select false, 'Reservations are closed.'::text;
    return;
  end if;

  update picks
     set status = 'cancelled', cancelled_at = now()
   where user_id = v_user_id
     and session_id = p_session_id
     and status = 'confirmed';

  get diagnostics v_found = row_count;

  if v_found then
    update sessions
       set taken = greatest(0, taken - 1), updated_at = now()
     where id = p_session_id;
    return query select true, 'Released.'::text;
  else
    return query select false, 'No active reservation for that session.'::text;
  end if;
end;
$$;

revoke all on function public.cancel_pick(text) from public;
grant execute on function public.cancel_pick(text) to authenticated;

-- =============================================================
-- 6. Realtime — broadcast updates so seat counters refresh live
-- =============================================================
-- Sessions: anyone subscribed sees the new `taken` value the moment
-- another attendee reserves a seat.
alter publication supabase_realtime add table public.sessions;
-- Picks: subscribers (the owner thanks to RLS) see their own picks
-- appear/cancel in real time, useful if the user has the planner open
-- in two tabs.
alter publication supabase_realtime add table public.picks;
