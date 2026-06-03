/* ============================================================
   NCTE 2026 — Supabase client bootstrap
   ----------------------------------------------------------------
   Loads after the @supabase/supabase-js UMD bundle has put a
   `supabase` object on window. Creates a single shared client at
   `window.supabaseClient` that auth.js, the planner and webinars.html
   all reuse.

   THE PUBLISHABLE KEY BELOW IS PUBLIC ON PURPOSE.
   Supabase publishable keys are designed to be exposed in the browser.
   Row Level Security policies (defined in supabase/schema.sql) are
   what actually protect the data — every table only lets a signed-in
   user touch their own rows. Never commit the SERVICE ROLE key — that
   one bypasses RLS and lives only in server-side code (Edge Functions).
   ============================================================ */
(function () {
  const SUPABASE_URL  = "https://tdhdwjsugijnxfaqzxnu.supabase.co";
  const SUPABASE_KEY  = "sb_publishable_ZRWAJiHd2YoX76sPIR9_2A_5pV-ADIf";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("[NCTE] Supabase JS SDK didn't load — registration and " +
                  "the Day 1 planner won't work. Check the <script src=...> tag " +
                  "for @supabase/supabase-js above this file.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      // Persist the session in localStorage and refresh tokens in the background.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // we don't use OAuth redirects yet
    },
  });
})();
