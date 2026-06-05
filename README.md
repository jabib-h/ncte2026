# NCTE 2026 — National Conference for Teachers of English (Costa Rica)

41st edition · July 8 & 9, 2026 · Hybrid (in-person Day 1 + virtual Day 2)
Organized by **CCCN** (Centro Cultural Costarricense-Norteamericano).

This repository powers the conference site and the registration / boarding-pass / validator system.

- **Production:** https://ncte.centrocultural.cr (Azure Static Web Apps)
- **Repository:** https://github.com/jabib-h/ncte2026
- **Database / auth:** Supabase project `tdhdwjsugijnxfaqzxnu`
- **Session log:** see [`CHANGELOG.md`](CHANGELOG.md)

> Deploys to production are done **manually** by policy. Push to `main`, then trigger the Azure SWA pipeline through the Azure portal when ready.

---

## Supabase setup — DO ONCE before the first sign-up

### 1. Apply the schema

Open the Supabase dashboard → SQL Editor → New query → paste the entire contents of `supabase/schema.sql` → **Run**. Then repeat with `supabase/seed.sql`. The schema is idempotent (drops the tables before recreating) so re-running during development is safe.

> **If you already have live users**, do NOT re-run `schema.sql` — it would wipe their accounts. Apply migrations in `supabase/migrations/` in chronological order instead. They are all non-destructive.

### 2. Authentication settings

Dashboard → **Authentication → Sign In / Providers → Email**
- "Confirm email" → **OFF** (faster onboarding; no inbox round-trip).
- Keep "Enable Email provider" ON.

Dashboard → **Authentication → URL Configuration**
- **Site URL:** `https://ncte.centrocultural.cr`
- **Redirect URLs:** add `https://ncte.centrocultural.cr/*` and (for local testing) `http://localhost:*/*`.

### 3. Verify Realtime

Dashboard → **Database → Replication**. Confirm that `public.sessions` and `public.picks` are in the `supabase_realtime` publication (the schema file adds them; eyeball after each re-apply).

---

## How the system fits together

### Files at a glance

| File / dir                     | Role |
|--------------------------------|------|
| `supabase/schema.sql`          | DB structure, RLS policies, RPC functions, triggers |
| `supabase/seed.sql`            | Day 1 session catalog (IDs match `data-id` on planner cards) |
| `supabase/migrations/`         | Non-destructive migrations applied to live DB after `schema.sql` |
| `supabase-config.js`           | Creates `window.supabaseClient` (URL + publishable anon key) |
| `auth.js`                      | `NCTEAuth.register / login / logout / requireAuth / onChange` — wraps Supabase Auth |
| `ncte.js`                      | Shared header + auth modal + scroll spy + mobile nav |
| `boarding-pass.js` + `.css`    | Shared boarding-pass module (modal preview + A4 PDF download) |
| `index.html`                   | Marketing site + sessions catalog |
| `webinars.html`                | Free virtual registration (Day 2) |
| `registro-presencial.html`     | Day 1 in-person planner — atomic seat reservations + boarding-pass CTA |
| `v/index.html`                 | Entrance validator served at `/v/{NCTE-XXXXXX}` |
| `privacy.html`, `terms.html`, `code-of-conduct.html` | Legal pages (skeletons; CCCN team fills in content) |
| `staticwebapp.config.json`     | Azure SWA routing — rewrites `/v/*` → `/v/index.html` + security headers |

### Database tables

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
ticket_code (NCTE-XXXXXX)      created_at, updated_at
checked_in_at
created_at, updated_at
```

### Postgres functions (all `SECURITY DEFINER`)

| Function | Caller | Purpose |
|----------|--------|---------|
| `handle_new_user()`           | trigger only | Mirrors `auth.users` → `profiles` on signup; generates `ticket_code` |
| `generate_ticket_code()`      | trigger only | Crockford-style alphabet, no 0/O/1/I/L/U |
| `reserve_session(p_session_id)` | `authenticated` | Atomic check-and-insert: locks the session row, releases user's previous pick in same block, increments `taken` |
| `cancel_pick(p_session_id)`   | `authenticated` | Releases a confirmed pick + decrements `taken` |
| `lookup_ticket(p_code)`       | `anon`, `authenticated` | Read attendee record + picks by ticket code (used by the validator) |
| `check_in(p_code)`            | `anon`, `authenticated` | Idempotent — first call stamps `checked_in_at`, subsequent calls return existing stamp |

Both seat-management RPCs enforce the **policy cutoff**: reservations close at `2026-07-08 00:00 CR`. Past that point they return `success: false, message: "Reservations are closed."`. Edit the `v_deadline` constant inside the functions if the date moves.

### Realtime — live seat counters

The planner subscribes to `postgres_changes` on `public.sessions`. When *any* attendee reserves or cancels, every other open browser sees the new `taken` value and updates "X of 30 seats left" without a page refresh.

### Row-Level Security at a glance

| Table    | Read              | Insert/Update/Delete |
|----------|-------------------|----------------------|
| profiles | own row only      | own row only         |
| sessions | public read       | service role only    |
| picks    | own rows only     | RPCs only (no direct DML from clients) |

---

## Boarding pass system

Each attendee gets a **personal boarding pass PDF** generated client-side from the planner page. There is no email confirmation.

1. Signup → `handle_new_user` trigger assigns `ticket_code` = `NCTE-XXXXXX`.
2. Planner sidebar exposes two CTAs once at least one room is picked:
   - **Print my boarding pass →** (primary): renders the on-page `.npass` node with `html2canvas`, wraps it in an A4 `jsPDF`, downloads `NCTE-2026-{code}.pdf`.
   - **See my boarding pass** (secondary): opens the same node in a modal so the attendee can verify before printing.
3. The QR encodes `https://ncte.centrocultural.cr/v/{ticket_code}` so the on-site staff can validate by scanning with any phone camera.

### Libraries (lazy-loaded from jsDelivr on first click)

| Library     | Purpose                |
|-------------|------------------------|
| QRious 4.0.2    | Render QR straight into a `<canvas>` |
| html2canvas 1.4.1 | Capture the `.npass` node as PNG |
| jsPDF 2.5.2     | Wrap the PNG in an A4 page |

No server cost, no email deliverability risk. The logo is converted to a `data:` URI at runtime so the resulting canvas is not tainted under `file://` testing.

### Where the module is available

`boarding-pass.js` exposes `window.NCTEBoardingPass.preview(opts?)` and `.download(opts?)`. It's loaded on `index.html`, `webinars.html` and `registro-presencial.html`. The "My boarding pass" item in the logged-in dropdown calls it from anywhere.

### CSP note

If `staticwebapp.config.json`'s Content-Security-Policy is enabled, add `https://cdn.jsdelivr.net` to `script-src` and `img-src` so the lazy loads keep working.

---

## Entrance validator — `/v/{code}`

When staff scans a boarding-pass QR with any phone camera, the OS opens `https://ncte.centrocultural.cr/v/NCTE-XXXXXX`. That URL is served by `v/index.html` (via the SWA rewrite of `/v/*`).

- The page calls `lookup_ticket(p_code)` and renders the attendee's full record + Day 1 picks.
- Staff taps **"Mark check-in →"** to call `check_in(p_code)` — stamps `profiles.checked_in_at = now()` idempotently. A re-scan shows the original timestamp (no overwrite).
- The page is `noindex,nofollow` and labelled "Staff · Entrance".

**Privacy model:** both RPCs are callable by `anon`. The ticket code itself is the secret. With ~200 valid codes in a 30⁶ ≈ 729M space, brute force is impractical, but a leaked code reveals full PII (name, email, phone, institution, picks). This trade-off was accepted on 2026-06-04 to keep the staff flow camera-scan-only.

For local development the path is `v/index.html?code=NCTE-XXXXXX` (no Azure rewrite available off-platform). The script handles both URL forms.

The validator is reachable from the homepage's **Staff Members** band, between the final CTA and the footer.

---

## Local development

Open `index.html` directly in the browser (`file://`) or run a tiny static server:

```bash
python -m http.server 8000      # then visit http://localhost:8000
```

For mobile-viewport testing, DevTools → Toggle device toolbar (Ctrl+Shift+M).

Brand-mark sizes live as CSS variables in `styles.css:72-93` — tweak there to resize logos across the whole site.

All internal links use **relative paths** (`registro-presencial.html`, `webinars.html`, `index.html`) instead of absolute ones (`/registro-presencial`). This keeps the site working under `file://`, Vercel cleanUrls and Azure SWA without needing host-side rewrites.

---

## Pending work

See [`CHANGELOG.md`](CHANGELOG.md) for the per-session log of what shipped. Items still open:

1. **Legal pages content** — `privacy.html` / `terms.html` / `code-of-conduct.html` exist as skeletons; CCCN's team fills in the official copy.
2. **Speaker photos + sponsor logos** — replace initials avatars and placeholder cards.
3. **Admin view** — restricted page for CCCN staff to download the roster and per-session attendee lists.
4. **Waitlist** for sessions that go full — promote the first in queue when someone cancels.
5. **Day 2 Zoom-link delivery** — `send-zoom-links` Edge Function that runs 24 h before each webinar.
6. **Supabase "Leaked password protection"** — paid Pro-tier feature; revisit when plan upgrades.

---

## License & contact

© 2026 CCCN · National Conference for Teachers of English (Costa Rica).
Questions about the codebase or the conference: **ncte@centrocultural.cr**.
