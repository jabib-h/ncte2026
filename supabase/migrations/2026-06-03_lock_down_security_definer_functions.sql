-- =============================================================
-- Migration · 2026-06-03 · Security hardening of SECURITY DEFINER
-- helpers introduced by the ticket_code migration.
-- Idempotent. Already applied to project tdhdwjsugijnxfaqzxnu via the
-- Supabase MCP server on 2026-06-03 — re-running locally is a no-op.
-- =============================================================

-- 1) Pin search_path on generate_ticket_code so a hostile schema can't
--    be inserted into resolution while a privileged caller is using
--    the helper.
create or replace function public.generate_ticket_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_alpha constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_len   constant int  := length(v_alpha);
  v_code  text;
  v_tries int := 0;
begin
  loop
    v_code := 'NCTE-' ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alpha, 1 + floor(random() * v_len)::int, 1);
    exit when not exists (
      select 1 from public.profiles where ticket_code = v_code
    );
    v_tries := v_tries + 1;
    if v_tries > 8 then
      raise exception 'generate_ticket_code: no free code after 8 tries';
    end if;
  end loop;
  return v_code;
end;
$$;

-- 2) handle_new_user is a TRIGGER function only. Strip every REST EXECUTE
--    grant so it can never be invoked via /rest/v1/rpc/handle_new_user.
revoke execute on function public.handle_new_user()      from public;
revoke execute on function public.handle_new_user()      from anon;
revoke execute on function public.handle_new_user()      from authenticated;

-- 3) generate_ticket_code is a helper for the trigger; not part of the
--    public API surface.
revoke execute on function public.generate_ticket_code() from public;
revoke execute on function public.generate_ticket_code() from anon;
revoke execute on function public.generate_ticket_code() from authenticated;

-- 4) reserve_session + cancel_pick are the only SECURITY DEFINER RPCs
--    the planner page is supposed to call. Make the grants explicit so
--    no residual default-PUBLIC grant leaks to the anon role.
revoke execute on function public.reserve_session(text)  from public;
revoke execute on function public.reserve_session(text)  from anon;
grant  execute on function public.reserve_session(text)  to authenticated;

revoke execute on function public.cancel_pick(text)      from public;
revoke execute on function public.cancel_pick(text)      from anon;
grant  execute on function public.cancel_pick(text)      to authenticated;
