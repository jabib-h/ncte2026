-- =============================================================
-- Migration · 2026-06-03 · Add `ticket_code` to profiles
-- Safe to run on a live DB — preserves existing data. Idempotent.
-- =============================================================

-- 1) Generator: NCTE-XXXXXX with a confusion-free alphabet (no
--    0/O/1/I/L/U) so scanning at the entrance is reliable even from
--    a smudged print-out.
create or replace function public.generate_ticket_code()
returns text
language plpgsql
as $$
declare
  v_alpha   constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';  -- 30 chars
  v_len     constant int  := length(v_alpha);
  v_code    text;
  v_tries   int := 0;
begin
  loop
    v_code := 'NCTE-' ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1);
    -- 30^6 = ~729M combos. Collision probability is negligible until
    -- attendee count reaches tens of thousands; this loop just guards
    -- the theoretical case.
    exit when not exists (
      select 1 from public.profiles where ticket_code = v_code
    );
    v_tries := v_tries + 1;
    if v_tries > 8 then
      raise exception 'generate_ticket_code: could not find a free code after 8 tries';
    end if;
  end loop;
  return v_code;
end;
$$;

-- 2) Add column (idempotent) + unique constraint.
alter table public.profiles
  add column if not exists ticket_code text;

-- A small index helps the validator app's reverse lookup by code.
create unique index if not exists profiles_ticket_code_unique
  on public.profiles (ticket_code);

-- 3) Backfill existing rows that don't have one yet.
update public.profiles
   set ticket_code = public.generate_ticket_code()
 where ticket_code is null;

-- 4) Now that every row has a code, enforce NOT NULL.
alter table public.profiles
  alter column ticket_code set not null;

-- 5) Update the new-user trigger so future signups get a code automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, phone, institution, role, country, ticket_code
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',  ''),
    coalesce(new.raw_user_meta_data->>'last_name',   ''),
    coalesce(new.raw_user_meta_data->>'phone',       ''),
    coalesce(new.raw_user_meta_data->>'institution', ''),
    coalesce(new.raw_user_meta_data->>'role',        'other'),
    coalesce(new.raw_user_meta_data->>'country',     'CR'),
    public.generate_ticket_code()
  );
  return new;
end;
$$;
