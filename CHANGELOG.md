# NCTE 2026 — Changelog

Reverse-chronological. Each entry covers one working session.

## 2026-06-11 (2) — Speaker avatar redesign, sponsor/partner cards, section spacing

### Speakers (`index.html` #speakers, `ncte.css`)
- `.nspk__avatar` photos are now circular (profile-picture style) instead
  of the previous blob/rounded-rectangle shape, which didn't crop the
  presenter photos well.
- Added a `mask-image: radial-gradient(...)` fade on `.nspk__avatar` so
  the photo edge dissolves into the strand-colored `.nspk__media`
  background instead of ending in a hard circle outline.
- Mark Cormier & Pablo Torres' two-photo split avatar inherits the new
  circular mask automatically (no HTML change needed).

### Sponsors and Partners (`index.html` #sponsors, `ncte.css`)
- Replaced the flat `.nsponsors__logo` pill links with a centered
  `.nsponsors__cards` grid (2 columns, 1 column on mobile ≤600px).
- Each `.nsponsors__card` is now a full card: category tag, org name,
  a short description, and a "domain.com →" link — the whole card links
  out to the org's site.
- Removed dead CSS: `.nsponsors__logo.platinum` and the
  `.nsponsors__logo.is-clickable` "+" hint (no longer used anywhere).
  Base `.nsponsors__logo` / `.nsponsors__logos` rules are kept for
  `ncte-print.html`'s plain Spanish sponsors mirror.

### Section spacing review
- `#register` and `#sponsors` share the cream background and already had
  reduced `clamp(44px, 6vw, 80px)` padding between them — added a
  hairline `border-top` on `#sponsors` so the section break stays visible
  even with the tighter gap. Other section transitions (alternating
  cream/white backgrounds, `#sponsors` → `#faq`) already read clearly and
  needed no change.

## 2026-06-11 — Final Day 1 schedule, speaker photos, sponsors/partners

### Sessions catalog (`index.html` #sesiones, #strands, #speakers)
- Replaced the demo Day 1 concurrent lineup with the **final confirmed
  schedule** from "NCTE 2026 - SCHEDULE": 3 morning concurrents (11:00 am)
  and 4 afternoon concurrents (4:00 pm) — was 4 + 4.
  - New: Junuén Mondragón "AI in Action..." (11am), Jay Lee-Gopalan
    "Education Needs Infrastructure, Not Apps" (Jinso), Oscar Víquez
    "Adding Emotion to an AI Assisted Learning Experience" (Universidad
    Latina), Juan Carlos Rivera "Supporting English Language
    Professionals... RELO" (U.S. Embassy Panama).
  - Updated: Jonathan Acuña's session moves 11am → 4pm with a new title
    ("From Reflection to Action..."). Marcela Vaglio's session keeps its
    4pm slot/strand but gets a new title ("From Information to
    Inspiration..."). Junuén Mondragón's 2pm plenary gets a new title
    ("The Art of Teaching in the Age of Algorithms") and moves to 90 min.
  - Mitchel Resnick's Day 2 webinar (Webinar 05, 4:00 pm) is replaced by
    Camilo Sánchez, "Prompting with a Purpose: AI Strategies for the ESL
    Classroom" (Jinso) — updated in `webinars.html` too.
  - Strand session-link lists updated to match (Strand 03 — Inclusive Ed
    — gains Oscar Víquez; Strand 05 — Moving Forward — gains Jay
    Lee-Gopalan and Camilo Sánchez, replacing Mitchel Resnick).
- Added real presenter photos for every speaker in #sesiones and
  #speakers (previously initials-only avatars). New CSS pattern:
  `.nact__speaker-avatar`, `.ndetail__speaker-avatar`, `.nspk__avatar`,
  and `.nroom__avatar` (planner) get `overflow:hidden` + a child `<img>`
  with `object-fit:cover`. Mark Cormier & Pablo Torres' combined avatar
  uses a new two-photo split layout (each photo at 50% width).

### Planner (`registro-presencial.html`)
- Morning block: "(6 simultaneous)" / "Pick 1 of 6" → "(3 simultaneous)"
  / "Pick 1 of 3", with the 3 new room cards above.
- Afternoon block: "(6 simultaneous)" / "Pick 1 of 6" → "(4 simultaneous)"
  / "Pick 1 of 4", with the 4 updated/new room cards above.
- Afternoon plenary card text updated to match Mondragón's new title and
  90-min duration.
- Fixed two leftover hardcoded "6 simultaneous sessions" / "Pick 1 of 6"
  strings in the summary-sidebar JS — now derived from a
  `{ morning: 3, afternoon: 4 }` map so the empty-state copy and block
  chips match the new room counts per slot.

### Day 2 schedule list (`index.html` #schedule)
- Fixed a leftover "Interactive Webinar 5 · Mitchel Resnick" row (with
  `href="#act-resnick"`) that the earlier #sesiones/#strands/#speakers
  pass missed — now points to `#act-sanchez` / Camilo Sánchez.

### Copy (`index.html` hero/about/program)
- "Two days. One complete conference." → "Two days. One comprehensive
  program." (more formal).
- "...uninterrupted since 1984" → "...since 1984".
- "+30 sessions, workshops and webinars..." → "+15 sessions, workshops
  and webinars..." (matches the trimmed final lineup).
- Schedule section: "6 simultaneous rooms" → "3 simultaneous rooms"
  (11am block) / "4 simultaneous rooms" (4pm block).

### Sponsors → Sponsors and Partners
- Removed the placeholder Platinum / Gold / Education Partners tiers
  (Cambridge, Pearson, Macmillan, Oxford, British Council, ETS TOEFL,
  UCR, UNED, INA) and the unused `sponsor-info-tpl` detail modal.
- New flat structure with two groups:
  - **Sponsors**: Jinso (jinso.com), National Geographic Learning
    (eltngl.com).
  - **Partners**: U.S. Embassy in Costa Rica (cr.usembassy.gov/es),
    MEP Costa Rica (mep.go.cr).
  - Each links out directly to the org's site (`target="_blank"`).
  - Mirrored in `ncte-print.html` (Spanish: "Patrocinadores y Aliados").

### Database (project `tdhdwjsugijnxfaqzxnu`, applied via MCP)
- Migration `2026-06-11_replace_day1_concurrent_sessions.sql`: replaced
  `public.sessions` Day 1 rows to match the new catalog (`mondragon-ai`,
  `leegopalan`, `viquez`, `acuna`, `cormier-torres`, `vaglio`, `rivera`).
  `vaglio` keeps its id with an updated title; `cormier-torres` is
  unchanged. The 4 removed rooms (`m-room-b`, `m-room-c`, `m-room-d`,
  `a-room-c`, `a-room-d`) and the old `acuna` (11am) are dropped.
- **Real confirmed picks existed** for the removed/recreated session ids
  (4 picks for the dropped rooms, 5 picks — 3 confirmed + 2 cancelled —
  for the old `acuna`). Per explicit decision, those pick rows were
  hard-deleted along with the sessions rather than migrated forward.
- `supabase/seed.sql` updated to match for fresh local setups.

### Open items / judgment calls made without blocking
- Marcela Vaglio's session keeps `strand="assessment"` even though her
  new title doesn't mention assessment — done to avoid leaving Strand 02
  (Assessment) empty.
- Jay Lee-Gopalan and Camilo Sánchez (both Jinso) have no nationality in
  the source data — labelled "🌎 International".
- Juan Carlos Rivera (U.S. Embassy Panama RELO) labelled "🇵🇦 Panama" —
  inferred from his office, not explicitly stated in the source Excel.

---

## 2026-06-04 (5) — Validator gate + sponsor cleanup

### Validator passcode
- `v/index.html` now opens behind a **staff passcode gate**. Code is
  `C3ntr0-2026` (literal compare; this is a soft barrier against
  casual visitors, not cryptographic — anyone with the URL +
  view-source can read it).
- Unlock is stored in `sessionStorage` so the gate doesn't re-prompt
  during the staff's shift, and it auto-expires when the tab closes.
- A **"Lock this device"** button appears in the footer once unlocked
  so staff can re-arm the gate before handing off a phone or tablet.
- The validator UI styles the gate with the same brand palette (red
  + blue lock icon, error toast under the form, "stays active until
  you close this tab" hint).

### Sponsors UX
- Removed the **"Contact {{sponsor}} →"** mailto CTA from every
  sponsor detail card. The detail modal still shows tier / category /
  activation / program copy — just no contact button. The note copy
  drops the "write to us" sentence since the contact prompt is gone.

---

## 2026-06-04 (4) — Mobile + content + docs

### Mobile fixes
- **Planner page** (`registro-presencial.html`) — extra responsive tier
  at 480 / 360 px: tighter hero meta, smaller ident card padding,
  compact summary rows with shorter time column, plenary slots get
  smaller icons + body, room cards get tighter padding and reduced
  chip size. Added `min-width: 0` to every nested grid/flex child
  (planner grid columns, blocks, rooms, speaker text) and an
  `overflow-x: clip` belt on every section. No more horizontal scroll
  on iPhone-class viewports.
- **Boarding pass modal** — fluid `.npass` width on phones (no more
  640px hard width). Pass node restructures: head wraps with the
  attendee ID flowing to a second row, attendee block is tighter,
  meta becomes 1-col, QR section stacks centred. `boarding-pass.js`
  now temporarily forces `width: 640px` during the html2canvas
  capture so the **PDF render still matches the desktop layout**
  regardless of the phone preview.

### Content
- **"Closing Cocktail" removed** as a discrete event. Block 5 is now
  **"Networking & Raffles"** across `index.html`, the planner page,
  the boarding-pass itinerary template (`boarding-pass.js`), the
  validator empty state, and the FAQ copy. The 6 pm VIP cocktail in
  `ncte-print.html` is a separate event and was left intact.

### Legal scaffolding
- New `privacy.html`, `terms.html`, `code-of-conduct.html` — skeleton
  pages with the brand-coherent sub-header, hero, "work in progress"
  banner and the section headings CCCN's team will fill in.
- Shared `legal.css` with hero + article styles (numbered section
  eyebrows, prose typography, responsive tiers at 720 / 480 px).
- Footer links in `index.html` updated from `#` placeholders to the
  new pages.

### Docs
- `NOTES-MVP.md` deleted. `README.md` rewritten as the canonical
  operations + architecture reference (the project graduated out of
  MVP scope, so the file name no longer fits).

---

## 2026-06-04 (3) — Boarding pass polish

### Bug fixes
- **`Tainted canvases may not be exported`** during PDF export. Cause:
  on `file://`, Chrome treats every local resource as cross-origin,
  so `<img src="assets/MAIN_LOGO.png">` taints the html2canvas output
  canvas, and the subsequent `toDataURL()` throws. Fix: before
  rendering, `boarding-pass.js` now fetches the logo, converts it to
  a `data:` URI, and swaps the `<img src>` to that URI (data URIs
  don't taint). Multi-method fallback (fetch → XHR → text-only
  fallback) so it works on http(s) AND `file://` in Chrome, Firefox,
  and Safari.
- **Logo distortion in boarding pass**. Added `object-fit: contain`,
  `max-width: 220px`, and `flex-shrink: 0` to `.npass__logo` so the
  natural 2.17:1 aspect is preserved at the fixed 38px height,
  whatever the container does.
- **Backdrop scrolled with the pass content**. The `.npass-modal__backdrop`
  was `position: absolute` inside the scrolling modal, so on tall
  boarding passes the bottom of the page underneath was exposed when
  scrolling. Switched to `position: fixed` so the navy overlay stays
  pinned to the viewport regardless of scroll position.

### UX
- **"My pass" moved into the user dropdown** alongside "My itinerary"
  and "Sign out". The standalone red chip next to the avatar is gone.
  Header is now cleaner: two pills only — `[user dropdown]` and
  `[Save my spot]`.

---

## 2026-06-04 (cont.) — UX polish + bug fixes

### Header redesign
- User bubble in `.ncte-header__cta` is now a **dropdown trigger** —
  click reveals a menu with **My itinerary** and **Sign out**. The
  dedicated logout icon button next to the avatar is gone (its action
  moved into the dropdown).
- The 3 logged-in pills (`user`, `my pass`, `save my spot` /
  `data-cta-primary`) all share `height: 40px` so they sit on the
  same vertical centre — fixes the staggered look in the previous
  layout.
- Dropdown closes on outside click, Escape, or any in-menu click.
- Avatar bubble drops its 2-line text (`name` + `My itinerary` subtitle)
  in favour of a single-line `name` + chevron — rotates 180° when open.

### Staff Members band
- New `.nstaff` section between the final marketing CTA and the
  footer in `index.html`. Visually muted (navy gradient, no big
  hero treatment) so it doesn't compete with the conversion CTA.
- Single CTA links to `v/index.html` (the boarding-pass validator).

### Bug fixes
- **QR library** swapped from `qrcode@1.5.3` (intermittent jsDelivr
  404 on the `/build/` path) to **QRious 4.0.2** — small, stable,
  renders directly into a `<canvas>`. The "Print my boarding pass →"
  flow now produces the PDF reliably.
- **`v/index.html` absolute asset paths** (`/assets/MAIN_LOGO.png`,
  `/assets/favicon.svg`, `href="/"` back-link) all resolved to
  `C:\...` under `file://` local testing. Switched to relative form
  (`../assets/...`, `../index.html`) — works in both `file://`,
  Vercel cleanUrls, and Azure SWA with the `/v/*` rewrite.
- **`auth.js` requireAuth fallback** also had `target = o.redirect || "/"`
  which would resolve to `C:\` under `file://`. Changed default to
  `"index.html"`.

---

## 2026-06-04 — Entrance validator

### Features
- **`/v/{code}` validator page** (`v/index.html`). When staff scans the
  boarding-pass QR with any phone camera, the OS opens
  `https://ncte.centrocultural.cr/v/NCTE-XXXXXX` in the browser. The
  page renders the full attendee record, Day 1 picks, and a
  prominent **"Mark check-in →"** button. Idempotent: re-scans
  show the original check-in timestamp instead of overwriting.
- **Manual code entry fallback** on the same page — if the URL has
  no code (e.g. staff opens `/v/` directly), a form accepts
  `NCTE-XXXXXX` with client-side regex validation.

### Database (project `tdhdwjsugijnxfaqzxnu`, applied via MCP)
- New `profiles.checked_in_at timestamptz` (nullable).
- New RPC `public.lookup_ticket(p_code text)` — SECURITY DEFINER,
  callable by `anon`, normalizes the code (uppercase + trim),
  returns the full profile + confirmed picks as `jsonb`. Returns
  `found = false` for unknown codes (never raises) so the page can
  render a friendly error.
- New RPC `public.check_in(p_code text)` — SECURITY DEFINER,
  callable by `anon`, idempotent: first call stamps `now()`,
  subsequent calls return the existing stamp + `already = true`.
- Migration file: `supabase/migrations/2026-06-04_validator_lookup_and_checkin.sql`.
- `schema.sql` synced for fresh setups.

### Hosting / routing
- New `staticwebapp.config.json` at the repo root:
  - Rewrites `/v/*` → `/v/index.html` so path-style codes work
  - Adds the same security headers that `vercel.json` had
- Takes effect on the next Azure SWA deploy.

### Privacy model (chosen 2026-06-04)
- Validator page shows **full PII** (name, email, phone,
  institution, picks). Trade-off accepted: convenience for staff
  over hardening against code enumeration. Codes are 30^6 ≈ 729M
  possible values vs ~200 valid; brute force impractical but a
  leaked code reveals everything for that holder.
- Page is `noindex,nofollow` and labelled "Staff · Entrance".
- No auth gate — required for QR-to-phone-camera flow.

### Pending (deferred)
- "Leaked password protection" Supabase toggle — confirmed to be a
  paid Pro-tier feature; revisit when plan upgrades.

---

## 2026-06-03 — Boarding pass PDF + DB hardening

### Features
- **Downloadable boarding pass** replaces the email-confirmation flow.
  Client-side render of a branded ticket card → html2canvas → A4 jsPDF.
  Includes attendee ID, QR (encodes `https://ncte.centrocultural.cr/v/{code}`),
  full Day 1 itinerary, Day 2 zoom-link notice.
- **Shared boarding-pass module** (`boarding-pass.js` + `boarding-pass.css`)
  exposes `window.NCTEBoardingPass.{ preview, download }`. Usable from any
  signed-in page; lazy-loads qrcode + html2canvas + jsPDF on first call.
- **Header entry point**: red "🎫 My pass" chip in the logged-in user slot
  (homepage + webinars). Planner sidebar keeps its dedicated CTAs
  ("Print my boarding pass" + "See my boarding pass").
- **"My Itinerary" tag** added to the planner sub-header so the user
  always knows which page they are on (hidden on phones).

### Database (Supabase project `tdhdwjsugijnxfaqzxnu`)
- Added `profiles.ticket_code` (text, unique, NOT NULL) — format
  `NCTE-XXXXXX` from a 30-char confusion-free alphabet (no 0/O/1/I/L/U).
- New `public.generate_ticket_code()` Postgres function with retry-on-collision.
- `handle_new_user()` trigger now populates `ticket_code` automatically on signup.
- Migration files:
  - `supabase/migrations/2026-06-03_ticket_code.sql`
  - `supabase/migrations/2026-06-03_lock_down_security_definer_functions.sql`
- Security hardening (from `get_advisors`):
  - `search_path = public` pinned on `generate_ticket_code` (mutable-search-path warning)
  - Explicit `REVOKE EXECUTE ... FROM anon, public, authenticated` on
    trigger-only functions (`handle_new_user`, `generate_ticket_code`)
  - Explicit grants on RPCs (`reserve_session`, `cancel_pick`): authenticated only

### Live-DB repairs (via Supabase MCP)
- Backfilled 3 orphan `auth.users` (rows from earlier signups that had no
  corresponding profile after a `schema.sql` re-run) with profiles +
  generated ticket codes.
- Re-seeded the 8 Day 1 sessions catalog (also wiped on the same re-run).

### Refactors
- Removed the inline boarding-pass styles (~200 LoC), modal HTML (~80 LoC),
  and rendering JS (~250 LoC) from `registro-presencial.html`; planner
  now delegates to the shared module with `account` + `picks` in scope.
- Normalized internal hrefs from absolute (`/registro-presencial`,
  `/webinars`, `/`) to relative (`registro-presencial.html`,
  `webinars.html`, `index.html`) for portability across `file://`,
  Vercel cleanUrls, and Azure SWA.

### Bug fixes
- Repaired 14 broken `webinars.html#webinar-N` hrefs in `index.html`'s
  Sessions section after a prior PowerShell `-replace` ate the `#` /
  closing `"` (the `$1` backreference didn't expand through bash → ps
  → .NET regex).
- Replaced inline `confirm-via-email` Edge Function call (`send-confirmation`)
  with the boarding-pass CTAs. Edge Function kept on disk for reference,
  no longer invoked.
- Swapped `qrcode@1.5.4` → `qrcode@1.5.3` on jsDelivr — 1.5.4 dropped the
  `/build/qrcode.min.js` path that the script tag uses.

### Tooling
- Supabase MCP server connected (`project_ref=tdhdwjsugijnxfaqzxnu`).
  Verifications + repairs above were run directly through MCP instead of
  copy/paste into the SQL editor.

### Pending (deferred)
- Enable **Auth → Sign In / Providers → Email → "Prevent use of leaked
  passwords"** in the Supabase dashboard (advisor still flags this).
- External QR-reader validator app needs a `/v/{code}` route or REST
  endpoint that queries `profiles where ticket_code = ?` with a
  service-role JWT.
- Legal pages (Privacy Policy, Terms, Code of Conduct) still point to `#`.
- Speaker photos + sponsor logos still placeholders.
- Dedicated `/itinerario` page (planner currently doubles as itinerary).

---

## Earlier sessions

For sessions before 2026-06-03, see the project memory files at
`~/.claude/projects/.../memory/project_ncte2026.md`.
