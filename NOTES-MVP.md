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

## Confirmation email — deploy the Edge Function (one-time setup)

The branded confirmation email lives in
`supabase/functions/send-confirmation/index.ts`. To get it actually sending:

### 1. Create a Resend account (free tier is plenty)

- https://resend.com → sign up.
- API Keys → "Create API Key" → name `ncte-prod` → copy the `re_...` value.

### 2. Verify the centrocultural.cr domain in Resend

- Resend dashboard → Domains → "Add Domain" → `centrocultural.cr`.
- Resend prints 3-4 DNS records (TXT + MX + DKIM CNAME). Hand them to whoever
  manages DNS at the CCCN (likely an IT/infra contact). They add them on the
  centrocultural.cr DNS provider. Propagation takes 1-30 minutes.
- Once verified (green checkmark), `ncte@centrocultural.cr` can send mail.

### 3. Install the Supabase CLI (one-time)

```bash
# Windows
scoop install supabase
# or via npm
npm i -g supabase
```

### 4. Link the local repo to the project and push the function

```bash
cd "CCCN - NCTE (2026)"
supabase login                          # opens the browser
supabase link --project-ref tdhdwjsugijnxfaqzxnu

# Set the secrets the function reads at runtime
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
supabase secrets set EMAIL_FROM='NCTE 2026 <ncte@centrocultural.cr>'
supabase secrets set EMAIL_REPLY_TO=ncte@centrocultural.cr

# Deploy
supabase functions deploy send-confirmation
```

### 5. Test from the planner

Open `/registro-presencial`, pick a room, click "Email me my confirmation →".
A toast confirms; the email lands in the registered inbox within ~10 seconds.

### Sandbox testing without DNS (optional)

While DNS is still propagating you can leave `EMAIL_FROM` unset; the function
falls back to `onboarding@resend.dev` (Resend's shared sandbox). Email arrives
but the From won't be the CCCN domain — fine for QA, not for the final cutover.

---

## Things still pending (roadmap)

1. **"Mi itinerario" page** — currently the avatar already routes to
   `/registro-presencial` and the planner doubles as the itinerary view.
   A dedicated `/itinerario` with profile editing + Day 2 Zoom links + a
   downloadable PDF is still TBD.
2. **Legal pages** — Privacy Policy, Terms, Code of Conduct (currently
   linked to `#`).
3. **Speaker photos + sponsor logos** — replace initials avatars and
   placeholder cards.
4. **Admin view** — restricted page for CCCN staff to download the
   roster and per-session attendee lists (Supabase view + a tiny dashboard).
5. **Waitlist** for sessions that go full — promote the first in queue
   when someone cancels.
6. **Day 2 Zoom links email** — separate send-zoom-links function that
   runs 24h before each webinar.

## Local development

Open `index.html` directly in the browser (file://) or run a tiny static
server:
```
python -m http.server 8000      # then visit http://localhost:8000
```
For mobile-viewport testing, DevTools → Toggle device toolbar (Ctrl+Shift+M).

Brand-mark sizes live as CSS variables in `styles.css:72-93` — tweak there
to resize logos across the whole site.
