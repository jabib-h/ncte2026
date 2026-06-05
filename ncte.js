/* ============================================================
   NCTE 2026 — shell, modals, interactivity
   ============================================================ */
(function () {
  const NAV = [
    { id: "about",     href: "#about",     label: "About" },
    { id: "schedule",  href: "#schedule",  label: "Program" },
    { id: "sesiones",  href: "#sesiones",  label: "Sessions" },
    { id: "strands",   href: "#strands",   label: "Strands" },
    { id: "speakers",  href: "#speakers",  label: "Speakers" },
    { id: "register",  href: "#register",  label: "Register" },
    { id: "sponsors",  href: "#sponsors",  label: "Sponsors" },
    { id: "faq",       href: "#faq",       label: "FAQ" },
  ];

  function icon(name) {
    const icons = {
      menu:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
      close:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      arrow:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
      play:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      check:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      plus:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
      cal:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
      pin:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      users:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      clock:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      wifi:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 13a10 10 0 0 1 14 0M2 9a14 14 0 0 1 20 0M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>',
      mic:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>',
      brain:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3 3 3 0 0 0 3-3V8a3 3 0 0 0-3-3z"/><path d="M9 8a3 3 0 0 1-3 3v2a3 3 0 0 1 3 3M15 8a3 3 0 0 0 3 3v2a3 3 0 0 0-3 3"/></svg>',
      heart:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      target:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
      book:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5A2.5 2.5 0 0 0 4 19.5z"/></svg>',
      mail:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
      lock:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
      user:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      chev:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
      logout:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17l5-5-5-5M20 12H9M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/></svg>',
      ticket:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 5v2M13 11v2M13 17v2"/></svg>',
      eye:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
      eyeOff:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.93 10.93 0 0 1 12 19c-6 0-10-7-10-7a18.5 18.5 0 0 1 4.21-5.21M9.88 4.24A10.45 10.45 0 0 1 12 4c6 0 10 7 10 7a18.45 18.45 0 0 1-2.27 3.34M14.12 14.12A3 3 0 1 1 9.88 9.88M1 1l22 22"/></svg>',
      fb:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>',
      ig:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.58 0 4.85.07 1.17.05 1.8.25 2.23.42a3.7 3.7 0 0 1 1.37.9c.42.43.7.84.9 1.36.16.42.36 1.06.42 2.23C21.96 8.42 22 8.8 22 12s0 3.58-.07 4.85c-.05 1.17-.26 1.8-.42 2.23a3.7 3.7 0 0 1-.9 1.37 3.7 3.7 0 0 1-1.37.9c-.42.16-1.06.36-2.23.42-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.06-1.8-.26-2.23-.42a3.7 3.7 0 0 1-1.37-.9 3.7 3.7 0 0 1-.9-1.37c-.16-.42-.36-1.06-.42-2.23C2.04 15.58 2 15.2 2 12s0-3.58.07-4.85c.06-1.17.26-1.81.42-2.23.21-.52.49-.93.9-1.36.43-.42.84-.7 1.37-.9.42-.17 1.06-.37 2.23-.42C8.42 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5 0-4.74.07-1.13.05-1.74.24-2.15.4-.54.21-.93.46-1.34.86-.4.4-.65.8-.86 1.34-.16.4-.35 1.02-.4 2.15C2.43 8.5 2.4 8.85 2.4 12s0 3.5.07 4.74c.05 1.13.24 1.74.4 2.15.21.54.46.93.86 1.34.4.4.8.65 1.34.86.4.16 1.02.35 2.15.4 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c1.13-.05 1.74-.24 2.15-.4.54-.21.93-.46 1.34-.86.4-.4.65-.8.86-1.34.16-.4.35-1.02.4-2.15.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.05-1.13-.24-1.74-.4-2.15a3.6 3.6 0 0 0-.86-1.34 3.6 3.6 0 0 0-1.34-.86c-.4-.16-1.02-.35-2.15-.4C15.5 4 15.15 4 12 4zm0 3.16a4.84 4.84 0 1 1 0 9.68 4.84 4.84 0 0 1 0-9.68zm0 8a3.16 3.16 0 1 0 0-6.32 3.16 3.16 0 0 0 0 6.32zm6.16-8.19a1.13 1.13 0 1 1-2.26 0 1.13 1.13 0 0 1 2.26 0z"/></svg>',
      ln:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.45v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
      yt:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.8.5-5.8s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
      x:       '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.39 8.44L23 22h-6.797l-5.33-6.97L4.8 22H1.54l7.9-9.026L1 2h6.972l4.82 6.37L18.244 2zm-1.19 18h1.836L7.06 4H5.105l11.95 16z"/></svg>',
    };
    return icons[name] || "";
  }

  // The "ribbon globe" mark — concentric ellipse arcs wrapping a sphere
  function ribbonGlobe(opts) {
    const cls = opts && opts.class || "ribbon-globe";
    const src = (opts && opts.variant === "white") ? "assets/ncte-globe-white.png" : "assets/ncte-globe-red.png";
    return `<img class="${cls}" src="${src}" alt="NCTE" />`;
  }

  // Thin wrappers around NCTEAuth so the rest of the file keeps reading nicely.
  function getUser() {
    return (window.NCTEAuth && window.NCTEAuth.currentUser()) || null;
  }
  function escapeHtml(s) {
    return (window.NCTEAuth && window.NCTEAuth.escapeHtml)
      ? window.NCTEAuth.escapeHtml(s)
      : String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
  }
  function displayName(u) {
    if (!u) return "";
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return full || (u.email || "").split("@")[0];
  }
  function initialsOf(u) {
    if (!u) return "";
    const src = displayName(u) || u.email || "";
    return src.split(/[ .@_-]/).filter(Boolean).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  }

  function header(active) {
    const links = NAV.map(n => `<a href="${n.href}" class="${active === n.id ? "is-active" : ""}">${n.label}</a>`).join("");
    return `
    <header class="ncte-header">
      <div class="strip-flag"></div>
      <div class="container ncte-header__bar">
        <a class="ncte-header__logo" href="#top" aria-label="NCTE 2026 · National Conference for Teachers of English Costa Rica">
          <img class="ncte-header__brand-mark" src="assets/MAIN_LOGO.png" alt="NCTE Costa Rica"/>
        </a>
        <nav class="ncte-header__nav" aria-label="Principal">${links}</nav>
        <div class="ncte-header__cta">
          <span data-user-slot></span>
          <a data-cta-primary class="btn btn-primary" href="#register" data-auth-open="signup">Register ${icon("arrow")}</a>
          <button class="btn-icon ncte-header__menu" aria-label="Open menu" data-mnav-open>${icon("menu")}</button>
        </div>
      </div>
    </header>
    <aside class="nmnav" data-mnav>
      <div class="nmnav__panel">
        <button class="btn-icon nmnav__close" aria-label="Close" data-mnav-close>${icon("close")}</button>
        ${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join("")}
      </div>
    </aside>`;
  }

  function authModal() {
    return `
    <div class="nmodal" data-auth-modal role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="nmodal__card">
        <div class="nmodal__head">
          <div style="display:flex; gap:14px; align-items:center;">
            ${ribbonGlobe()}
            <div>
              <h3 id="auth-title">Register for NCTE 2026</h3>
              <small data-auth-sub>One account · access to every webinar and in-person planner.</small>
            </div>
          </div>
          <button class="nmodal__close" type="button" data-auth-close aria-label="Close">${icon("close")}</button>
        </div>
        <div class="nmodal__body">
          <div class="nmodal__tabs" role="tablist">
            <button class="is-active" type="button" data-tab="signup">Create account</button>
            <button type="button" data-tab="signin">I already have one</button>
          </div>

          <form class="nmodal__form" data-auth-form novalidate autocomplete="on">
            <div class="nmodal__alert" data-auth-error role="alert" style="display:none;"></div>

            <div data-only-signup>
              <div class="nmodal__row">
                <div class="field">
                  <label for="auth-first">First name</label>
                  <input id="auth-first" name="firstName" type="text" autocomplete="given-name" placeholder="Ana" maxlength="80"/>
                  <small class="field-error" data-err="firstName"></small>
                </div>
                <div class="field">
                  <label for="auth-last">Last name</label>
                  <input id="auth-last" name="lastName" type="text" autocomplete="family-name" placeholder="Rodríguez" maxlength="80"/>
                  <small class="field-error" data-err="lastName"></small>
                </div>
              </div>
            </div>

            <div class="field">
              <label for="auth-email">Email</label>
              <input id="auth-email" name="email" type="email" required autocomplete="email" placeholder="you@school.cr" maxlength="160"/>
              <small class="field-error" data-err="email"></small>
            </div>

            <div data-only-signup>
              <div class="nmodal__row">
                <div class="field">
                  <label for="auth-phone">Phone</label>
                  <input id="auth-phone" name="phone" type="tel" autocomplete="tel" placeholder="+506 8888 8888" maxlength="32"/>
                  <small class="field-error" data-err="phone"></small>
                </div>
                <div class="field">
                  <label for="auth-role">Role</label>
                  <select id="auth-role" name="role">
                    <option value="">Choose…</option>
                    <option value="teacher">English Teacher</option>
                    <option value="coordinator">Academic Coordinator</option>
                    <option value="trainee">Teacher in Training</option>
                    <option value="student">University Student</option>
                    <option value="other">Other</option>
                  </select>
                  <small class="field-error" data-err="role"></small>
                </div>
              </div>
              <div class="field">
                <label for="auth-inst">Institution</label>
                <input id="auth-inst" name="institution" type="text" autocomplete="organization" placeholder="School / university / institute" maxlength="160"/>
                <small class="field-error" data-err="institution"></small>
              </div>
              <div class="field">
                <label for="auth-country">Country</label>
                <select id="auth-country" name="country">
                  <option value="CR">Costa Rica</option>
                  <option value="NI">Nicaragua</option>
                  <option value="PA">Panama</option>
                  <option value="GT">Guatemala</option>
                  <option value="HN">Honduras</option>
                  <option value="SV">El Salvador</option>
                  <option value="MX">Mexico</option>
                  <option value="CO">Colombia</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="auth-pass">Password</label>
              <div class="field-with-toggle">
                <input id="auth-pass" name="password" type="password" required autocomplete="new-password" placeholder="At least 8 characters · letters + numbers" minlength="8" maxlength="200"/>
                <button type="button" class="field-pwd-toggle" data-pwd-toggle="auth-pass" aria-label="Show password" title="Show password">${icon("eye")}</button>
              </div>
              <small class="field-error" data-err="password"></small>
            </div>

            <div class="field" data-only-signup>
              <label for="auth-pass2">Confirm password</label>
              <div class="field-with-toggle">
                <input id="auth-pass2" name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Repeat your password" minlength="8" maxlength="200"/>
                <button type="button" class="field-pwd-toggle" data-pwd-toggle="auth-pass2" aria-label="Show password" title="Show password">${icon("eye")}</button>
              </div>
              <small class="field-error" data-err="passwordConfirm"></small>
            </div>

            <label class="nmodal__consent" data-only-signup>
              <input type="checkbox" name="consent"/>
              <span>I agree to receive my Zoom links and NCTE 2026 logistics by email from CCCN. <a href="#">Terms</a> · <a href="#">Privacy Policy</a>.</span>
            </label>
            <small class="field-error" data-err="consent"></small>

            <button class="btn btn-primary nmodal__submit" type="submit" data-submit-label>Create my account ${icon("arrow")}</button>
          </form>

          <div class="nmodal__foot" data-foot-signin style="display:none;">
            Don't have an account yet? <a href="#" data-switch="signup">Create account</a>
          </div>
          <div class="nmodal__foot" data-foot-signup>
            Already have an account? <a href="#" data-switch="signin">Sign in</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderUserSlot() {
    const slot = document.querySelector("[data-user-slot]");
    if (!slot) return;
    const u = getUser();
    if (u) {
      // Logged-in header reduces to 2 equal-height pills:
      //   [user dropdown]   [save my spot (data-cta-primary)]
      // The dropdown holds 3 menu items: My pass, My itinerary, Sign out.
      slot.innerHTML = `
        <div class="ncte-header__user-wrap" data-user-menu>
          <button class="ncte-header__user" type="button"
                  data-user-toggle
                  aria-haspopup="true" aria-expanded="false">
            <span class="avatar">${escapeHtml(initialsOf(u))}</span>
            <span class="ncte-header__user-name">${escapeHtml(displayName(u))}</span>
            <span class="ncte-header__user-chev">${icon("chev")}</span>
          </button>
          <div class="ncte-header__dropdown" data-user-dropdown role="menu" hidden>
            <button class="ncte-header__menu-item" type="button" data-pass-open role="menuitem">
              ${icon("ticket")}
              <span>My boarding pass</span>
            </button>
            <a class="ncte-header__menu-item" href="registro-presencial.html" role="menuitem">
              ${icon("cal")}
              <span>My itinerary</span>
            </a>
            <button class="ncte-header__menu-item is-danger" type="button" data-user-logout role="menuitem">
              ${icon("logout")}
              <span>Sign out</span>
            </button>
          </div>
        </div>`;

      const menu     = slot.querySelector("[data-user-menu]");
      const toggle   = slot.querySelector("[data-user-toggle]");
      const dropdown = slot.querySelector("[data-user-dropdown]");

      function closeMenu() {
        dropdown.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      }
      function openMenu() {
        dropdown.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        menu.classList.add("is-open");
      }
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.hidden ? openMenu() : closeMenu();
      });
      // Click outside the menu → close
      document.addEventListener("click", (e) => {
        if (!menu.contains(e.target)) closeMenu();
      });
      // Escape → close
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !dropdown.hidden) closeMenu();
      });
      // Close on any in-menu click (link or button) so dropdown collapses
      // before the action runs.
      dropdown.addEventListener("click", () => closeMenu());

      slot.querySelector("[data-pass-open]").addEventListener("click", (e) => {
        if (window.NCTEBoardingPass) {
          window.NCTEBoardingPass.preview({ button: e.currentTarget });
        } else {
          // Defensive fallback for pages where the module didn't load —
          // send the user to the planner, which always has it.
          location.href = "registro-presencial.html";
        }
      });
      slot.querySelector("[data-user-logout]").addEventListener("click", async () => {
        await window.NCTEAuth.logout();
        toast("Signed out.");
        if (location.pathname.indexOf("registro-presencial") !== -1) {
          location.href = "index.html";
        }
      });
    } else {
      // Document-level [data-auth-open] handler in wireAuth picks this up.
      slot.innerHTML = `<button class="btn btn-ghost" type="button" data-auth-open="signin">Sign in</button>`;
    }
    renderCtaPrimary();
  }

  // The primary header CTA — "Register" when logged out, "Save my spot"
  // (navigation to the planner) when logged in.
  function renderCtaPrimary() {
    const btn = document.querySelector("[data-cta-primary]");
    if (!btn) return;
    if (getUser()) {
      btn.textContent = "Save my spot ";
      btn.insertAdjacentHTML("beforeend", icon("arrow"));
      btn.setAttribute("href", "registro-presencial.html");
      btn.removeAttribute("data-auth-open");
    } else {
      btn.textContent = "Register ";
      btn.insertAdjacentHTML("beforeend", icon("arrow"));
      btn.setAttribute("href", "#register");
      btn.setAttribute("data-auth-open", "signup");
    }
    renderConferenceCtaLabels();
  }

  // All marketing-section "Register for the conference" CTAs (the ones that
  // historically just scrolled to #register) get rewritten to "Save my spot"
  // when the user is signed in. The footer text link and small nav anchors
  // are intentionally NOT touched — only `.btn`-shaped CTAs.
  function renderConferenceCtaLabels() {
    const loggedIn = !!getUser();
    document.querySelectorAll('a.btn[href^="#register"]').forEach(a => {
      if (!a.dataset.ctaLabelOut) a.dataset.ctaLabelOut = a.innerHTML;
      a.innerHTML = loggedIn
        ? "Save my spot " + icon("arrow")
        : a.dataset.ctaLabelOut;
    });
  }

  // Global click router for every "register / save my spot" CTA on the page.
  // The marketing copy has 30+ of these scattered across hero, catalog, CTA
  // banners and the footer — keeping the routing here means we don't have
  // to mark them up one by one.
  function setupConferenceCtaRouter() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";

      // 1) Any link to the in-person planner — either the production clean
      //    URL (`/registro-presencial`) or the relative file form
      //    (`registro-presencial.html`) we use for portability across
      //    file://, Vercel and Azure SWA.
      const isSaveSpot = /(?:^|\/)registro-presencial(?:\.html)?(?:[?#]|$)/.test(href);
      // 2) `.btn`-shaped CTAs that historically scrolled to #register (the
      //    pricing section). Plain anchor links inside nav menus or text
      //    paragraphs keep their scroll-to-section behavior.
      const isRegisterCta = a.classList.contains("btn")
                         && (href === "#register" || href.startsWith("#register"));

      if (!isSaveSpot && !isRegisterCta) return;

      // The modal already handles its own opener attribute — don't double-fire.
      if (a.hasAttribute("data-auth-open")) return;

      const loggedIn = !!getUser();

      if (loggedIn) {
        // Already an attendee — every conference-action CTA leads straight
        // to the planner, even the ones that historically scrolled to the
        // pricing section.
        if (isRegisterCta) {
          e.preventDefault();
          location.href = "registro-presencial.html";
        }
        // For `isSaveSpot` the default <a> navigation already goes there.
        return;
      }

      // Guest — open the signup modal first and remember to drop them at
      // the planner once they finish registering.
      e.preventDefault();
      try { sessionStorage.setItem("ncte_intent_return", "registro-presencial.html"); } catch {}
      openAuth("signup");
    });
  }

  let _authMode = "signup";
  let _authBusy = false;

  function modalEl() { return document.querySelector("[data-auth-modal]"); }

  function openAuth(mode) {
    _authMode = mode === "signin" ? "signin" : "signup";
    const m = modalEl();
    if (!m) return;
    m.classList.add("is-open");
    document.body.classList.add("is-detail-open");
    syncAuthMode();
    setTimeout(() => {
      const first = m.querySelector(_authMode === "signup" ? "#auth-first" : "#auth-email");
      first && first.focus();
    }, 60);
  }
  function closeAuth() {
    const m = modalEl();
    if (!m) return;
    m.classList.remove("is-open");
    document.body.classList.remove("is-detail-open");
    clearAuthErrors();
  }
  function syncAuthMode() {
    const isSignup = _authMode === "signup";
    document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("is-active", b.dataset.tab === _authMode));
    document.querySelectorAll("[data-only-signup]").forEach(el => el.style.display = isSignup ? "" : "none");
    document.querySelector("[data-submit-label]").innerHTML = (isSignup ? "Create my account " : "Sign in ") + icon("arrow");
    document.querySelector("[data-foot-signin]").style.display = isSignup ? "none" : "";
    document.querySelector("[data-foot-signup]").style.display = isSignup ? "" : "none";
    document.getElementById("auth-title").textContent = isSignup
      ? "Register for NCTE 2026"
      : "Welcome back";
    const sub = document.querySelector("[data-auth-sub]");
    if (sub) sub.textContent = isSignup
      ? "One account · access to every webinar and in-person planner."
      : "Sign in to manage your registration and pick your in-person sessions.";
    // Mirror required-ness so HTML5 validation matches the visible fields
    document.querySelectorAll("[data-only-signup] input, [data-only-signup] select").forEach(el => {
      if (el.name && el.name !== "consent") el.required = isSignup;
      if (!isSignup) { el.setCustomValidity?.(""); }
    });
    const consent = document.querySelector("[name=consent]");
    if (consent) consent.required = isSignup;
    clearAuthErrors();
  }

  function clearAuthErrors() {
    document.querySelectorAll("[data-err]").forEach(el => { el.textContent = ""; });
    document.querySelectorAll("[data-auth-form] .field").forEach(el => el.classList.remove("has-error"));
    const alertEl = document.querySelector("[data-auth-error]");
    if (alertEl) { alertEl.style.display = "none"; alertEl.textContent = ""; }
  }
  function showFieldErrors(fields) {
    Object.keys(fields).forEach(name => {
      const target = document.querySelector(`[data-err="${name}"]`);
      if (target) {
        target.textContent = fields[name];
        target.closest(".field")?.classList.add("has-error");
      }
    });
  }
  function showAuthAlert(msg) {
    const alertEl = document.querySelector("[data-auth-error]");
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.style.display = "";
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (_authBusy) return;
    clearAuthErrors();
    const fd = new FormData(e.currentTarget);
    const isSignup = _authMode === "signup";
    _authBusy = true;
    const btn = document.querySelector("[data-submit-label]");
    const originalBtn = btn.innerHTML;
    btn.innerHTML = isSignup ? "Creating account…" : "Signing in…";
    try {
      let user;
      if (isSignup) {
        user = await window.NCTEAuth.register({
          firstName:       fd.get("firstName"),
          lastName:        fd.get("lastName"),
          email:           fd.get("email"),
          phone:           fd.get("phone"),
          institution:     fd.get("institution"),
          role:            fd.get("role"),
          country:         fd.get("country"),
          password:        fd.get("password"),
          passwordConfirm: fd.get("passwordConfirm"),
          consent:         fd.get("consent") === "on" || fd.get("consent") === "true",
        });
        toast("Account created. You're in.");
      } else {
        user = await window.NCTEAuth.login(fd.get("email"), fd.get("password"));
        toast("Signed in.");
      }
      closeAuth();
      // Honour a return intent from gated pages
      let ret = null;
      try { ret = sessionStorage.getItem("ncte_intent_return"); } catch {}
      if (ret && ret !== location.pathname + location.search) {
        sessionStorage.removeItem("ncte_intent_return");
        location.href = ret;
      }
    } catch (err) {
      if (err && err.fields) showFieldErrors(err.fields);
      showAuthAlert(err.message || "Something went wrong. Please try again.");
    } finally {
      _authBusy = false;
      btn.innerHTML = originalBtn;
    }
  }

  function togglePasswordVisibility(toggleBtn) {
    const id = toggleBtn.dataset.pwdToggle;
    const input = document.getElementById(id);
    if (!input) return;
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggleBtn.innerHTML = icon(showing ? "eye" : "eyeOff");
    toggleBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    toggleBtn.setAttribute("title",      showing ? "Show password" : "Hide password");
    // Keep focus on the field so typing continues naturally
    input.focus();
  }

  function wireAuth() {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-auth-open]");
      if (opener) { e.preventDefault(); openAuth(opener.dataset.authOpen); return; }
      if (e.target.closest("[data-auth-close]")) { closeAuth(); return; }
      const tab = e.target.closest("[data-tab]");
      if (tab) { _authMode = tab.dataset.tab; syncAuthMode(); return; }
      const sw = e.target.closest("[data-switch]");
      if (sw) { e.preventDefault(); _authMode = sw.dataset.switch; syncAuthMode(); return; }
      const pwdToggle = e.target.closest("[data-pwd-toggle]");
      if (pwdToggle) { e.preventDefault(); togglePasswordVisibility(pwdToggle); return; }
    });
    const m = modalEl();
    if (!m) return;
    m.addEventListener("click", (e) => { if (e.target === m) closeAuth(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAuth(); });
    document.querySelector("[data-auth-form]").addEventListener("submit", handleAuthSubmit);

    // React to login/logout from any tab or button
    if (window.NCTEAuth && window.NCTEAuth.onChange) {
      window.NCTEAuth.onChange(() => renderUserSlot());
    }

    // Honour hash intents like "#register" / "#signin"
    const intent = (location.hash || "").replace("#", "").toLowerCase();
    if (intent === "register" || intent === "signup") openAuth("signup");
    else if (intent === "signin" || intent === "login") openAuth("signin");
  }

  function wireMobileNav() {
    const drawer = document.querySelector("[data-mnav]");
    if (!drawer) return;
    document.querySelectorAll("[data-mnav-open]").forEach(b => b.addEventListener("click", () => drawer.classList.add("is-open")));
    document.querySelectorAll("[data-mnav-close]").forEach(b => b.addEventListener("click", () => drawer.classList.remove("is-open")));
    drawer.addEventListener("click", (e) => { if (e.target === drawer) drawer.classList.remove("is-open"); });
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("is-open")));
  }

  function wireFaq() {
    document.querySelectorAll("[data-faq-q]").forEach(q => {
      q.addEventListener("click", () => {
        q.closest(".nfaq__item").classList.toggle("is-open");
      });
    });
  }

  /* Scrollspy — highlights the nav link whose section is closest to the top
     of the viewport (just below the sticky header band). Earlier versions
     flickered because the previous IntersectionObserver picked whichever
     section happened to fire last; this version tracks the set of
     currently-visible sections and always picks the topmost one. */
  function wireScrollSpy() {
    const links = [...document.querySelectorAll(".ncte-header__nav a[href^='#']")];
    if (!links.length) return;
    const linkByHash = Object.fromEntries(links.map(a => [a.getAttribute("href"), a]));
    const sections = links
      .map(a => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!sections.length) return;

    let activeHash = null;
    const visibleIds = new Set();

    function setActive(hash) {
      if (hash === activeHash) return;
      activeHash = hash;
      links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === hash));
    }

    function pickActive() {
      // Of the sections currently within the activation band, pick the one
      // whose top edge is closest to (but not past) the top of the band.
      let best = null;
      visibleIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        if (best === null || top < best.top) best = { id, top };
      });
      if (best) setActive("#" + best.id);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) visibleIds.add(e.target.id);
        else visibleIds.delete(e.target.id);
      });
      pickActive();
    }, {
      // Activation band: top ~15% to ~35% of viewport. Wider than before so
      // it works on tall sections without flicker, narrow enough to stay precise.
      rootMargin: "-15% 0px -65% 0px",
      threshold: 0,
    });

    sections.forEach(s => io.observe(s));

    // On clicks, set active immediately for a snappier feel (don't wait for scroll)
    links.forEach(a => a.addEventListener("click", () => setActive(a.getAttribute("href"))));
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%) translateY(20px)",
      background: "var(--cccn-blue-900)", color: "#fff", padding: "12px 18px",
      borderRadius: "999px", fontWeight: "600", fontSize: "14px", zIndex: 9999,
      boxShadow: "0 12px 32px -8px rgba(0,0,0,.3)", opacity: "0",
      transition: "opacity .2s ease, transform .2s ease"
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; });
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(-50%) translateY(20px)"; }, 2400);
    setTimeout(() => el.remove(), 2700);
  }

  function renderShell({ active } = {}) {
    const headerHost = document.querySelector("[data-ncte-header]");
    const modalHost  = document.querySelector("[data-ncte-modal]");
    if (headerHost) headerHost.outerHTML = header(active);
    if (modalHost)  modalHost.outerHTML  = authModal();

    wireMobileNav();
    wireFaq();
    wireScrollSpy();
    wireGlobeScrollRotate();
    wireAuth();
    setupConferenceCtaRouter();
    renderUserSlot();
  }

  /* The hero globe responds to scroll: scrolling rotates it AND nudges it up/down (parallax).
     A tiny ambient drift keeps it alive when the page is idle. */
  function wireGlobeScrollRotate() {
    const target = document.querySelector(".nhero__globe");
    if (!target) return;
    let lastY = window.scrollY;
    let rot = 0, targetRot = 0;
    let ty = 0,  targetTy = 0;
    const ROT_FACTOR = 0.10;   // degrees per pixel scrolled (slower)
    const TY_FACTOR  = -0.06;  // negative = parallax up while scrolling down
    const TY_MAX     = 80;     // cap translateY range so it doesn't wander
    const SMOOTH     = 0.08;   // easing factor (lower = smoother/slower)
    const DRIFT      = 0.02;   // ambient deg/frame when idle

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const dy = y - lastY;
      targetRot += dy * ROT_FACTOR;
      targetTy = Math.max(-TY_MAX, Math.min(TY_MAX, y * TY_FACTOR));
      lastY = y;
    }, { passive: true });

    function tick() {
      targetRot += DRIFT;
      rot += (targetRot - rot) * SMOOTH;
      ty  += (targetTy  - ty)  * SMOOTH;
      target.style.transform = `translateY(${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.NCTE = { renderShell, icon, ribbonGlobe, openAuth, toast };
})();
