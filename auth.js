/* ============================================================
   NCTE 2026 — Auth module (MVP, localStorage-backed)
   ============================================================
   PUBLIC API (window.NCTEAuth):
     register(payload)   -> Promise<user>
     login(email, pass)  -> Promise<user>
     logout()            -> void
     currentUser()       -> user | null
     requireAuth(opts)   -> user | null  (redirects if missing)
     onChange(cb)        -> unsubscribe fn
     escapeHtml(str)     -> safe string for innerHTML

   The body of every method is the ONLY place we touch storage,
   so swapping to Supabase later means rewriting just this file:
   - register -> supabase.auth.signUp({ email, password, options:{ data: profile }})
   - login    -> supabase.auth.signInWithPassword({ email, password })
   - logout   -> supabase.auth.signOut()
   - currentUser -> supabase.auth.getUser() (cached in memory)
   - onChange -> supabase.auth.onAuthStateChange(cb)

   PASSWORDS: stored as PBKDF2-SHA-256 derivations with per-user salt.
   This is NOT a replacement for server-side hashing — anyone with access
   to localStorage can read the hash and brute-force offline. It exists so
   the temp URL doesn't leak plaintext passwords to a casual inspector and
   so swapping to Supabase is a one-file change.
   ============================================================ */
(function () {
  "use strict";

  const USERS_KEY   = "ncte_users_v1";    // { [email]: profile + credentials }
  const SESSION_KEY = "ncte_session_v1";  // { email, issuedAt }

  const PBKDF2_ITERS = 150_000;
  const SALT_BYTES   = 16;
  const KEY_BITS     = 256;

  const listeners = new Set();

  /* ============== utils ============== */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[c]);
  }

  function toHex(buf) {
    const b = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
    return s;
  }

  function fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  async function hashPassword(password, saltHex) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Your browser does not support secure hashing. Please use a modern browser.");
    }
    const salt = saltHex ? fromHex(saltHex) : window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
      baseKey, KEY_BITS
    );
    return { hash: toHex(bits), salt: toHex(salt) };
  }

  // Constant-time-ish compare to avoid trivial timing leaks
  function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}") || {}; }
    catch { return {}; }
  }
  function writeUsers(map) {
    localStorage.setItem(USERS_KEY, JSON.stringify(map));
  }

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }
  function writeSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  function profileOf(record) {
    if (!record) return null;
    // Never return the password hash to the rest of the app
    const { passwordHash, salt, ...rest } = record;
    return rest;
  }

  function emit() {
    const u = currentUser();
    listeners.forEach(fn => { try { fn(u); } catch (e) { /* noop */ } });
  }

  /* ============== validation ============== */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+()\-.\s\d]{7,}$/;

  function validateRegistration(p) {
    const errors = {};
    if (!p.firstName || !p.firstName.trim())   errors.firstName   = "Required";
    if (!p.lastName  || !p.lastName.trim())    errors.lastName    = "Required";
    if (!p.email || !EMAIL_RE.test(p.email))   errors.email       = "Enter a valid email";
    if (!p.phone || !PHONE_RE.test(p.phone))   errors.phone       = "Enter a valid phone";
    if (!p.institution || !p.institution.trim()) errors.institution = "Required";
    if (!p.role)                               errors.role        = "Select a role";
    if (!p.password || p.password.length < 8)  errors.password    = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(p.password) || !/\d/.test(p.password))
                                               errors.password    = "Mix letters and numbers";
    if (p.password !== p.passwordConfirm)      errors.passwordConfirm = "Passwords do not match";
    if (!p.consent)                            errors.consent     = "You must accept the terms";
    return errors;
  }

  /* ============== public API ============== */
  async function register(payload) {
    const errors = validateRegistration(payload);
    if (Object.keys(errors).length) {
      const err = new Error("Please review the highlighted fields.");
      err.fields = errors;
      throw err;
    }
    const email = normalizeEmail(payload.email);
    const users = readUsers();
    if (users[email]) {
      const err = new Error("That email is already registered. Sign in instead.");
      err.fields = { email: "Already registered" };
      throw err;
    }
    const { hash, salt } = await hashPassword(payload.password);
    const record = {
      email,
      firstName:   payload.firstName.trim(),
      lastName:    payload.lastName.trim(),
      phone:       payload.phone.trim(),
      institution: payload.institution.trim(),
      role:        payload.role,
      country:     (payload.country || "CR").trim(),
      createdAt:   new Date().toISOString(),
      passwordHash: hash,
      salt,
    };
    users[email] = record;
    writeUsers(users);
    writeSession({ email, issuedAt: Date.now() });
    emit();
    return profileOf(record);
  }

  async function login(email, password) {
    email = normalizeEmail(email);
    if (!EMAIL_RE.test(email) || !password) {
      throw new Error("Enter your email and password.");
    }
    const users = readUsers();
    const record = users[email];
    // Always run the hashing step — even if the user does not exist — so that
    // we don't leak account existence via response time.
    const fakeSalt = "00000000000000000000000000000000";
    const { hash } = await hashPassword(password, record ? record.salt : fakeSalt);
    if (!record || !safeEqual(hash, record.passwordHash)) {
      throw new Error("Email or password is incorrect.");
    }
    writeSession({ email, issuedAt: Date.now() });
    emit();
    return profileOf(record);
  }

  function logout() {
    writeSession(null);
    emit();
  }

  function currentUser() {
    const sess = readSession();
    if (!sess || !sess.email) return null;
    const users = readUsers();
    return profileOf(users[sess.email] || null);
  }

  function requireAuth(opts) {
    const u = currentUser();
    if (u) return u;
    const o = opts || {};
    const target = o.redirect || "/";
    // Hint the landing to open the auth modal in login mode
    try { sessionStorage.setItem("ncte_intent_auth", o.intent || "login"); } catch {}
    try { sessionStorage.setItem("ncte_intent_return", location.pathname + location.search); } catch {}
    location.replace(target + "#register");
    return null;
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  // Cross-tab sync: if another tab signs in/out, react here too
  window.addEventListener("storage", (e) => {
    if (e.key === SESSION_KEY || e.key === USERS_KEY) emit();
  });

  window.NCTEAuth = {
    register, login, logout, currentUser, requireAuth, onChange, escapeHtml,
    _internal: { hashPassword, validateRegistration }, // exposed for tests only
  };
})();
