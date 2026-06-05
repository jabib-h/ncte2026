/* ============================================================
   NCTE 2026 — Auth module (Supabase-backed)
   ----------------------------------------------------------------
   Same public API as the localStorage MVP (NCTEAuth.register / login /
   logout / currentUser / requireAuth / onChange / escapeHtml) so the
   rest of the app didn't have to change. All the storage and crypto
   work now lives on Supabase: signUp() / signInWithPassword() / a
   `profiles` table mirrored from auth.users via the on_auth_user_created
   trigger (see supabase/schema.sql).

   Why keep a wrapper instead of using window.supabaseClient directly?
   - The UI was already wired to NCTEAuth; the wrapper means zero changes
     to ncte.js / registro-presencial.html / webinars.html.
   - It lets us validate input shape client-side before bothering the
     network — same UX as the MVP (per-field errors).
   - We add a small in-memory cache for `currentUser()` so the header
     avatar doesn't flicker between renders.
   ============================================================ */
(function () {
  "use strict";

  if (!window.supabaseClient) {
    console.error("[NCTE Auth] window.supabaseClient is missing. " +
                  "Load @supabase/supabase-js and supabase-config.js before auth.js.");
    return;
  }
  const sb = window.supabaseClient;

  const listeners = new Set();
  let   cachedUser = null;   // { id, email, firstName, ... } | null
  let   loadingProfile = null; // promise — guards against parallel /profiles fetches

  /* ============== utils ============== */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[c]);
  }
  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  /* ============== validation (client side, before hitting the network) */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+()\-.\s\d]{7,}$/;

  function validateRegistration(p) {
    const errors = {};
    if (!p.firstName   || !p.firstName.trim())     errors.firstName   = "Required";
    if (!p.lastName    || !p.lastName.trim())      errors.lastName    = "Required";
    if (!p.email       || !EMAIL_RE.test(p.email)) errors.email       = "Enter a valid email";
    if (!p.phone       || !PHONE_RE.test(p.phone)) errors.phone       = "Enter a valid phone";
    if (!p.institution || !p.institution.trim())   errors.institution = "Required";
    if (!p.role)                                   errors.role        = "Select a role";
    if (!p.password    || p.password.length < 8)   errors.password    = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(p.password) || !/\d/.test(p.password))
                                                   errors.password    = "Mix letters and numbers";
    if (p.password !== p.passwordConfirm)          errors.passwordConfirm = "Passwords do not match";
    if (!p.consent)                                errors.consent     = "You must accept the terms";
    return errors;
  }

  /* ============== profile fetching =============== */
  async function fetchProfile(authUser) {
    if (!authUser) return null;
    const { data, error } = await sb
      .from("profiles")
      .select("id, email, first_name, last_name, phone, institution, role, country, ticket_code, created_at")
      .eq("id", authUser.id)
      .single();
    if (error) {
      // The signup trigger creates the row; if it isn't there yet (race) we
      // still want SOMETHING to display, so fall back to the auth.users data.
      // ticket_code is intentionally absent — the boarding-pass UI gates on it
      // and prompts the user to refresh until the trigger row arrives.
      console.warn("[NCTE Auth] profile fetch fell back to metadata:", error.message);
      const m = authUser.user_metadata || {};
      return {
        id:          authUser.id,
        email:       authUser.email,
        firstName:   m.first_name   || "",
        lastName:    m.last_name    || "",
        phone:       m.phone        || "",
        institution: m.institution  || "",
        role:        m.role         || "other",
        country:     m.country      || "CR",
        ticketCode:  null,
      };
    }
    return {
      id:          data.id,
      email:       data.email,
      firstName:   data.first_name,
      lastName:    data.last_name,
      phone:       data.phone,
      institution: data.institution,
      role:        data.role,
      country:     data.country,
      ticketCode:  data.ticket_code,
      createdAt:   data.created_at,
    };
  }

  async function refreshFromSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.user) { cachedUser = null; emit(); return; }
    if (!loadingProfile) {
      loadingProfile = fetchProfile(session.user)
        .then(p => { cachedUser = p; loadingProfile = null; emit(); return p; })
        .catch(e => { loadingProfile = null; throw e; });
    }
    return loadingProfile;
  }

  function emit() {
    listeners.forEach(fn => { try { fn(cachedUser); } catch (e) { /* noop */ } });
  }

  // Keep the cache + listeners in sync with Supabase's own auth state
  // (cross-tab login / token refresh / sign out from another window).
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      cachedUser = null;
      emit();
      return;
    }
    // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED — refresh the profile.
    refreshFromSession().catch(e => console.error("[NCTE Auth]", e));
  });

  // Kick off initial load (don't await — listeners will fire when ready).
  refreshFromSession().catch(e => console.error("[NCTE Auth]", e));

  /* ============== public API ============== */
  async function register(payload) {
    const errors = validateRegistration(payload);
    if (Object.keys(errors).length) {
      const err = new Error("Please review the highlighted fields.");
      err.fields = errors;
      throw err;
    }
    const email = normalizeEmail(payload.email);
    const meta = {
      first_name:  payload.firstName.trim(),
      last_name:   payload.lastName.trim(),
      phone:       payload.phone.trim(),
      institution: payload.institution.trim(),
      role:        payload.role,
      country:     (payload.country || "CR").trim(),
    };

    const { data, error } = await sb.auth.signUp({
      email,
      password: payload.password,
      options: { data: meta },
    });

    if (error) {
      // Supabase returns a generic error for duplicates; surface as field error.
      if (/already|registered|exists/i.test(error.message)) {
        const err = new Error("That email is already registered. Sign in instead.");
        err.fields = { email: "Already registered" };
        throw err;
      }
      throw new Error(error.message || "Could not create the account.");
    }

    // If email confirmation is OFF (per project settings), data.session is
    // populated and the user is already signed in. If confirmation is ON,
    // data.session is null and we'd need to prompt them to check email.
    if (data.session) {
      await refreshFromSession();
    } else {
      // Don't leave the UI thinking they're logged in. The caller can show
      // a "check your inbox" message; we surface a soft-error.
      const err = new Error("Account created. Please verify your email to sign in.");
      err.requiresVerification = true;
      throw err;
    }

    return cachedUser;
  }

  async function login(email, password) {
    email = normalizeEmail(email);
    if (!EMAIL_RE.test(email) || !password) {
      throw new Error("Enter your email and password.");
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(/invalid|credentials/i.test(error.message)
        ? "Email or password is incorrect."
        : error.message);
    }
    if (data.session) await refreshFromSession();
    return cachedUser;
  }

  async function logout() {
    await sb.auth.signOut();
    cachedUser = null;
    emit();
  }

  // Synchronous — returns the cached profile snapshot. Use refreshFromSession()
  // (or just await login/register) if you need to be sure it's current.
  function currentUser() {
    return cachedUser;
  }

  function requireAuth(opts) {
    const u = currentUser();
    if (u) return u;
    const o = opts || {};
    // Relative fallback so it works under file://, Vercel cleanUrls AND
    // Azure SWA. Absolute "/" resolves to the filesystem root locally.
    const target = o.redirect || "index.html";
    try { sessionStorage.setItem("ncte_intent_auth",   o.intent || "login"); } catch {}
    try { sessionStorage.setItem("ncte_intent_return", location.pathname + location.search); } catch {}
    location.replace(target + "#register");
    return null;
  }

  function onChange(cb) {
    listeners.add(cb);
    // Fire once with the current state so the caller doesn't need to also
    // read currentUser() right after subscribing.
    try { cb(cachedUser); } catch (e) { /* noop */ }
    return () => listeners.delete(cb);
  }

  window.NCTEAuth = {
    register, login, logout,
    currentUser, requireAuth, onChange, escapeHtml,
    // Async refresher for callers that need to be sure the profile is fresh
    // (e.g. immediately after a manual edit).
    refresh: refreshFromSession,
    // Bonus accessors for advanced callers:
    _client: sb,
    _internal: { validateRegistration, fetchProfile },
  };
})();
