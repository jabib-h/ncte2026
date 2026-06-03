# NCTE 2026 — Operations notes

## Production state

- Hosting: **Azure Static Web Apps** on `https://ncte.centrocultural.cr`.
- Repo: https://github.com/jabib-h/ncte2026
- Deploys to production are done **manually** (by policy). Push to `main`, then
  trigger the SWA pipeline through the Azure portal when ready.
- Database / auth backend: **Supabase project** `tdhdwjsugijnxfaqzxnu`.

---

## Supabase setup — DO ONCE before the first sign-up

### 1. Apply the schema (one-time)

Open the Supabase dashboard → SQL Editor → New query → paste the entire
contents of `supabase/schema.sql` → **Run**. Then repeat with
`supabase/seed.sql`. The schema is idempotent (drops the tables before
recreating) so re-running during testing is safe.

### 2. Disable email confirmation (matches the agreed policy)

Dashboard → **Authentication → Sign In / Providers → Email**
- "Confirm email" → **OFF** (faster onboarding, no inbox round-trip).
- Keep "Enable Email provider" ON.

### 3. Allow the production origin

Dashboard → **Authentication → URL Configuration**
- **Site URL**: `https://ncte.centrocultural.cr`
- **Redirect URLs**: add `https://ncte.centrocultural.cr/*` and (for local
  testing) `http://localhost:*/*`.

### 4. Verify Realtime is publishing the right tables

Dashboard → **Database → Replication**. Confirm that `public.sessions` and
`public.picks` are in the `supabase_realtime` publication (the schema file
adds them, but the dashboard view is good to eyeball after each re-apply).

---

## How the registration + planner system works

### Files at a glance

| File | Role |
|------|------|
| `supabase/schema.sql`      | DB structure, RLS policies, RPC functions |
| `supabase/seed.sql`        | Day 1 session catalog (matches HTML cards) |
| `supabase-config.js`       | Creates `window.supabaseClient` (URL + anon key) |
| `auth.js`                  | `NCTEAuth.register / login / logout / requireAuth / onChange` — wraps Supabase Auth |
| `ncte.js`                  | Header + modal UI; calls into `NCTEAuth` |
| `registro-presencial.html` | Day 1 planner: reads sessions, calls `reserve_session()` RPC, subscribes to Realtime |
| `webinars.html`            | Free virtual registration — single signup also enables Day 2 access |

### Tables

```
profiles                       sessions                       picks
─────────────────────────      ────────────────────────       ─────────────────────────
id (uuid, FK auth.users)       id (text, PK)                  id (bigserial, PK)
email                          day  (1 or 2)                  user_id  (FK profiles)
first_name                     block (morning/afternoon/...)  session_id (FK sessions)
last_name                      title, speaker, room           status (confirmed|cancelled)
phone                          strand, format                 created_at
institution                    capacity, taken                cancelled_at
role                           starts_at, duration_min
country                        active
created_at                     created_at, updated_at
```

### Reserve / change / cancel — atomic via Postgres function

The client never inserts into `picks` directly. Instead it calls one of two
SECURITY DEFINER functions:

- `reserve_session(p_session_id)` — locks the session row, checks capacity,
  releases the user's existing pick in the same block if any, then inserts
  the new pick and increments `sessions.taken`. All in one transaction —
  no race condition possible.
- `cancel_pick(p_session_id)` — releases an active pick and decrements
  `sessions.taken`.

Both functions enforce the **policy cutoff**: reservations close at
2026-07-08 00:00 CR (midnight before Day 1). Past that point both RPCs
return `success: false, message: "Reservations are closed."`. Edit the
`v_deadline` constant inside the functions if the date moves.

### Realtime — live seat counters

The planner subscribes to `postgres_changes` on the `sessions` table. When
*any* attendee reserves or cancels, every other open browser sees the new
`taken` value and updates the card's "X of 30 seats left" copy without a
page refresh.

### Row-Level Security at a glance

| Table    | Read              | Insert/Update/Delete |
|----------|-------------------|----------------------|
| profiles | own row only      | own row only         |
| sessions | public read      | service role only    |
| picks    | own rows only     | RPCs only (no direct DML from clients) |

---

## Things still pending (roadmap)

1. **Transactional emails** — Edge Function + Resend, triggered on `picks`
   insert/update (confirmation, change, cancellation, 24h reminder). Use
   `ncte@centrocultural.cr` as the From; configure SPF/DKIM/DMARC on the
   CCCN domain first.
2. **"Mi itinerario" page** — clicking the header avatar should open
   `/itinerario` with the user's profile + picks + Day 2 Zoom links +
   edit / sign out buttons.
3. **Legal pages** — Privacy Policy, Terms, Code of Conduct (currently
   linked to `#`).
4. **Speaker photos + sponsor logos** — replace initials avatars and
   placeholder cards.
5. **Admin view** — restricted page for CCCN staff to download the
   roster and per-session attendee lists (Supabase view + a tiny dashboard).
6. **Waitlist** for sessions that go full — promote the first in queue
   when someone cancels.

## Local development

Open `index.html` directly in the browser (file://) or run a tiny static
server:
```
python -m http.server 8000      # then visit http://localhost:8000
```
For mobile-viewport testing, DevTools → Toggle device toolbar (Ctrl+Shift+M).

Brand-mark sizes live as CSS variables in `styles.css:72-93` — tweak there
to resize logos across the whole site.
