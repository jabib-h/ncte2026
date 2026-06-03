// =============================================================
// NCTE 2026 — Edge Function: send-confirmation
// -------------------------------------------------------------
// Triggered by the planner when an attendee finishes choosing their
// Day 1 in-person sessions. Pulls their profile + active picks from
// the DB, renders the branded HTML email below, and sends it via
// Resend so the From address can be `ncte@centrocultural.cr`.
//
// DEPLOY:
//   supabase functions deploy send-confirmation
// SECRETS REQUIRED (set once):
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set EMAIL_FROM='NCTE 2026 <ncte@centrocultural.cr>'
//   supabase secrets set EMAIL_REPLY_TO='ncte@centrocultural.cr'
// =============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM     = Deno.env.get("EMAIL_FROM")     ?? "NCTE 2026 <onboarding@resend.dev>";
const EMAIL_REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? "ncte@centrocultural.cr";

// CORS allow-list — Azure SWA production + local dev
const ALLOWED_ORIGINS = new Set([
  "https://ncte.centrocultural.cr",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  // Vercel preview if you ever spin it back up
  "https://project-gq1d7.vercel.app",
]);

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") ?? "";
  const allow  = ALLOWED_ORIGINS.has(origin) ? origin : "https://ncte.centrocultural.cr";
  return {
    "Access-Control-Allow-Origin":      allow,
    "Access-Control-Allow-Headers":     "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":     "POST, OPTIONS",
    "Access-Control-Max-Age":           "86400",
    "Vary":                             "Origin",
  };
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST")    return json(req, 405, { error: "Method not allowed" });

  // 1) Authenticated client — uses the caller's JWT so RLS applies
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(req, 401, { error: "Missing Authorization header" });
  }
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr || !user) return json(req, 401, { error: "Invalid session" });

  // 2) Fetch profile + active picks. RLS limits us to this user automatically.
  const [profileRes, picksRes] = await Promise.all([
    sb.from("profiles")
      .select("email, first_name, last_name, institution, role")
      .eq("id", user.id).single(),
    sb.from("picks")
      .select("session_id, status, sessions!inner(id, day, block, title, speaker, room, starts_at, format)")
      .eq("status", "confirmed"),
  ]);

  if (profileRes.error) return json(req, 500, { error: "Profile fetch failed", detail: profileRes.error.message });
  if (picksRes.error)   return json(req, 500, { error: "Picks fetch failed",   detail: picksRes.error.message });

  const profile = profileRes.data;
  const picks   = picksRes.data ?? [];

  // 3) Render and send
  const html    = renderEmailHtml(profile, picks);
  const subject = picks.length
    ? "Your NCTE 2026 spots are confirmed"
    : "Your NCTE 2026 registration is confirmed";

  if (!RESEND_API_KEY) {
    // Helpful during local testing — still returns 200 so the UI flow works.
    console.warn("[send-confirmation] RESEND_API_KEY not set; skipping send.");
    return json(req, 200, { sent: false, skipped: "RESEND_API_KEY not configured" });
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:     EMAIL_FROM,
      to:       [profile.email],
      reply_to: EMAIL_REPLY_TO,
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("[send-confirmation] Resend error:", resendRes.status, detail);
    return json(req, 502, { error: "Email provider rejected the request", detail });
  }

  const out = await resendRes.json();
  return json(req, 200, { sent: true, id: out.id });
});

// =============================================================
// HTML email template — inline styles, table-based layout for
// maximum email-client compatibility. Brand tokens (red, blue,
// cream) mirror the values in styles.css.
// =============================================================
type Profile = { email: string; first_name: string; last_name: string; institution: string; role: string };
type Pick    = { session_id: string; sessions: { id: string; day: number; block: string; title: string; speaker: string | null; room: string | null; starts_at: string | null; format: string } };

function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function fmtCRTime(iso: string | null): string {
  if (!iso) return "TBA";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Costa_Rica",
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return iso; }
}

function blockLabel(block: string): string {
  if (block === "morning")   return "Morning block · 11:00 am";
  if (block === "afternoon") return "Afternoon block · 4:00 pm";
  return block;
}

function renderEmailHtml(profile: Profile, picks: Pick[]): string {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email;

  // Group picks by block so the email reads like a schedule, not a flat list.
  const byBlock = new Map<string, Pick[]>();
  picks.forEach(p => {
    const block = p.sessions.block;
    if (!byBlock.has(block)) byBlock.set(block, []);
    byBlock.get(block)!.push(p);
  });

  const picksHtml = picks.length === 0
    ? `<tr><td style="padding:18px 24px; color:#6b6e78; font-size:14px; text-align:center;">
         You have access to all Day 2 virtual webinars. When you're ready to pick your Day 1 in-person sessions, head back to <a href="https://ncte.centrocultural.cr/registro-presencial" style="color:#ee304e; font-weight:700; text-decoration:none;">Save my spot</a>.
       </td></tr>`
    : [...byBlock.entries()].map(([block, items]) => `
        <tr><td style="padding:18px 24px 6px;">
          <div style="font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#ee304e; font-weight:700;">${escapeHtml(blockLabel(block))}</div>
        </td></tr>
        ${items.map(p => `
          <tr><td style="padding:0 24px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff; border:1px solid #E6E7EC; border-radius:12px;">
              <tr>
                <td style="padding:18px 22px;">
                  <div style="font-size:16px; font-weight:700; color:#041a71; line-height:1.3;">${escapeHtml(p.sessions.title)}</div>
                  ${p.sessions.speaker ? `<div style="font-size:13.5px; color:#2a2f3d; margin-top:4px;">${escapeHtml(p.sessions.speaker)}</div>` : ""}
                  <div style="font-size:12.5px; color:#6b6e78; margin-top:8px;">
                    ${escapeHtml(p.sessions.room ?? "Room TBA")} · ${escapeHtml(fmtCRTime(p.sessions.starts_at))}
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        `).join("")}
      `).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>NCTE 2026 — registration confirmed</title>
</head>
<body style="margin:0; padding:0; background:#F6F4EF; font-family:'Raleway', Arial, Helvetica, sans-serif; color:#1a1d27;">
  <!-- Preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Your NCTE 2026 registration is confirmed${picks.length ? `, ${picks.length} Day 1 spot${picks.length === 1 ? "" : "s"} saved` : ""}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F4EF;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 24px 60px -24px rgba(11,19,32,.18);">

          <!-- HEADER STRIP — brand gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#ee304e 0%, #c20f2f 45%, #041a71 100%); padding:36px 32px 28px; color:#fff;">
              <div style="font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:rgba(255,255,255,.78); font-weight:700;">NCTE 2026 · National Conference for Teachers of English</div>
              <div style="font-size:30px; font-weight:300; line-height:1.05; letter-spacing:-.02em; margin-top:14px;">
                Your spot${picks.length === 1 ? "" : "s"} <strong style="font-weight:800;">${picks.length === 0 ? "is" : "are"} confirmed</strong>.
              </div>
              <div style="margin-top:14px; font-size:15px; color:rgba(255,255,255,.92); line-height:1.5;">
                Hi ${escapeHtml(fullName)} — thanks for joining the 41st edition. Here is your personal itinerary for July 8 & 9.
              </div>
            </td>
          </tr>

          <!-- ATTENDEE CARD -->
          <tr>
            <td style="padding:24px 24px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F4EF; border-radius:14px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#6b6e78; font-weight:700;">Attendee</div>
                    <div style="font-size:16px; font-weight:700; color:#041a71; margin-top:6px;">${escapeHtml(fullName)}</div>
                    <div style="font-size:13px; color:#2a2f3d; margin-top:2px;">${escapeHtml(profile.email)}</div>
                    ${profile.institution ? `<div style="font-size:13px; color:#6b6e78; margin-top:6px;">${escapeHtml(profile.institution)}</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DAY 1 SECTION -->
          <tr>
            <td style="padding:22px 24px 4px;">
              <div style="font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:#ee304e; font-weight:700; margin-bottom:6px;">Day 1 · Wednesday, July 8</div>
              <div style="font-size:20px; font-weight:700; color:#041a71;">In-person at CCCN Los Yoses</div>
              <div style="font-size:13px; color:#6b6e78; margin-top:4px; line-height:1.5;">
                Doors open at 8:30 am. Lanyard pickup is at the lobby. Opening plenary kicks off at 9:00 am — all attendees included, no extra registration needed.
              </div>
            </td>
          </tr>
          ${picksHtml}

          <!-- DAY 2 SECTION -->
          <tr>
            <td style="padding:24px 24px 4px; border-top:1px solid #E6E7EC; margin-top:24px;">
              <div style="font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:#ee304e; font-weight:700; margin-bottom:6px;">Day 2 · Thursday, July 9</div>
              <div style="font-size:20px; font-weight:700; color:#041a71;">Virtual · 6 live webinars</div>
              <div style="font-size:13.5px; color:#2a2f3d; margin-top:8px; line-height:1.55;">
                Your registration includes the full virtual program. Zoom links for all six sessions will arrive in a separate email 24 hours before each webinar starts.
              </div>
            </td>
          </tr>

          <!-- LOGISTICS NOTES -->
          <tr>
            <td style="padding:22px 24px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#E8EBF6; border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:12px; font-weight:700; color:#041a71; letter-spacing:.06em; text-transform:uppercase;">Need to change a session?</div>
                    <div style="font-size:13.5px; color:#2a2f3d; margin-top:6px; line-height:1.5;">
                      Pop back into <a href="https://ncte.centrocultural.cr/registro-presencial" style="color:#2d479d; font-weight:700; text-decoration:none;">Save my spot</a> any time before July 7 at midnight (Costa Rica time). After that, the schedule is locked.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 24px 32px; text-align:center; border-top:1px solid #E6E7EC; margin-top:24px;">
              <div style="font-size:12px; color:#6b6e78; line-height:1.55;">
                Organized by <strong style="color:#041a71;">Centro Cultural Costarricense-Norteamericano</strong> — a non-profit association.<br/>
                Questions? Reply to this email or write to <a href="mailto:ncte@centrocultural.cr" style="color:#ee304e; text-decoration:none; font-weight:700;">ncte@centrocultural.cr</a>.
              </div>
              <div style="font-size:11px; color:#95979f; margin-top:14px;">© 2026 CCCN · NCTE Costa Rica · 41st edition</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
