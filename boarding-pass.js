/* =============================================================
   NCTE 2026 — Boarding pass (shared module)
   ----------------------------------------------------------------
   Public API:
     window.NCTEBoardingPass.preview(opts?)   — open the visual modal
     window.NCTEBoardingPass.download(opts?)  — generate + save PDF

   opts (optional): { picks, account, button }
     - picks/account: pass them in to skip the Supabase fetch
       (the planner already has both in scope; the homepage doesn't).
     - button: the element that triggered the action. Used to swap
       its label to a "Loading…" state and restore it on completion.

   Requires (in this order, loaded by the host page):
     1. @supabase/supabase-js UMD
     2. supabase-config.js     (creates window.supabaseClient)
     3. auth.js                (creates window.NCTEAuth)
     4. boarding-pass.css      (visual styles)
   ============================================================= */
(function () {
  "use strict";

  if (!window.supabaseClient) {
    console.error("[NCTE BoardingPass] window.supabaseClient is missing.");
    return;
  }
  const sb = window.supabaseClient;

  /* ---- CDN libs — lazy-loaded the first time they are needed ---- */
  const CDN = {
    // QRious — small, stable QR generator that renders straight to a
    // <canvas>. Picked after the `qrcode` package's build path on
    // jsDelivr proved unreliable (1.5.4 dropped /build/, 1.5.3 also
    // intermittently 404s).
    qrcode:      "https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js",
    html2canvas: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    jspdf:       "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
  };
  const loadedScripts = new Set();
  function loadScript(src) {
    if (loadedScripts.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload  = () => { loadedScripts.add(src); resolve(); };
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  /* ---- The 5 fixed itinerary rows (plenaries + 2 picks + closing) ---- */
  const ITINERARY = [
    { time: "9:00 am",  type: "open",  title: "Opening Ceremony + Morning Plenary", note: "Max Bigman · CCCN Auditorium" },
    { time: "11:00 am", type: "pick",  slot: "morning",   pending: "Morning concurrent — not selected" },
    { time: "2:00 pm",  type: "open",  title: "Afternoon Plenary",                  note: "Junuen Mondragón · CCCN Auditorium" },
    { time: "4:00 pm",  type: "pick",  slot: "afternoon", pending: "Afternoon concurrent — not selected" },
    { time: "5:30 pm",  type: "open",  title: "Networking & Raffles",               note: "CCCN main hall · open to all Day 1 attendees" },
  ];

  /* ---- Modal HTML (injected once on first use) ---- */
  const MODAL_HTML = `
<div class="npass-modal" data-pass-modal aria-hidden="true" role="dialog" aria-labelledby="npass-modal-title">
  <div class="npass-modal__backdrop" data-pass-close></div>
  <div class="npass-modal__inner">
    <div class="npass-modal__actions">
      <h3 id="npass-modal-title" class="npass-modal__title">Your boarding pass</h3>
      <div class="npass-modal__buttons">
        <button type="button" class="btn btn-primary" data-pass-print-inside>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-3px;"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Download PDF
        </button>
        <button type="button" class="btn btn-ghost" data-pass-close>Close</button>
      </div>
    </div>
    <div class="npass-modal__stage">
      <div class="npass" data-pass>
        <div class="npass__strip"></div>
        <div class="npass__head">
          <div class="npass__brand">
            <img src="assets/MAIN_LOGO.png" alt="NCTE Costa Rica" class="npass__logo"/>
            <small>National Conference for Teachers of English · Costa Rica</small>
          </div>
          <div class="npass__id">
            <small>Attendee ID</small>
            <b data-pass-code>NCTE-______</b>
          </div>
        </div>
        <div class="npass__attendee">
          <div class="npass__avatar" data-pass-initials>NE</div>
          <div class="npass__attendee-body">
            <small>Attendee</small>
            <b data-pass-name>—</b>
            <span data-pass-email>—</span>
            <span data-pass-org>—</span>
          </div>
        </div>
        <div class="npass__meta">
          <div>
            <small>When</small>
            <b>Wed., July 8 · Day 1 In-person</b>
            <span>9:00 am – 6:00 pm CR</span>
          </div>
          <div>
            <small>Where</small>
            <b>CCCN Los Yoses</b>
            <span>San Pedro, San José</span>
          </div>
        </div>
        <div class="npass__day1">
          <small class="npass__section-label">Your Day 1 itinerary</small>
          <ul class="npass__list" data-pass-day1></ul>
        </div>
        <div class="npass__day2">
          <small class="npass__section-label">Day 2 · Virtual program</small>
          <p>Zoom links for the 6 webinars will arrive at <b data-pass-email-2>—</b> 24h before each session. No separate registration needed.</p>
        </div>
        <div class="npass__qr-section">
          <div class="npass__qr" data-pass-qr aria-label="Boarding pass QR code"></div>
          <div class="npass__qr-info">
            <small>Scan at the entrance</small>
            <b data-pass-code-2>NCTE-______</b>
            <span>This QR is personal and non-transferable. CCCN staff will scan it to validate your spot.</span>
          </div>
        </div>
        <div class="npass__foot">
          <span>Issued <span data-pass-issued>—</span></span>
          <span>centrocultural.cr · ncte@centrocultural.cr</span>
        </div>
      </div>
    </div>
  </div>
</div>`;

  /* ---- DOM bootstrap ---- */
  let modalEl = null;
  let passNode = null;
  let initialized = false;

  function ensureInjected() {
    if (initialized) return;
    initialized = true;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    modalEl  = document.querySelector("[data-pass-modal]");
    passNode = modalEl.querySelector("[data-pass]");

    modalEl.querySelectorAll("[data-pass-close]").forEach(el =>
      el.addEventListener("click", close));
    const insideBtn = modalEl.querySelector("[data-pass-print-inside]");
    if (insideBtn) insideBtn.addEventListener("click", () => download({ button: insideBtn }));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });
  }

  function isOpen() { return modalEl && modalEl.classList.contains("is-open"); }
  function open()   { modalEl.classList.add("is-open"); modalEl.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden"; }
  function close()  { modalEl.classList.remove("is-open"); modalEl.setAttribute("aria-hidden","true"); document.body.style.overflow = ""; }

  /* ---- Data fetch (used when caller doesn't pass in picks/account) ---- */
  async function fetchPicks() {
    const { data, error } = await sb.from("picks")
      .select("session_id, sessions!inner(block, title, speaker, room)")
      .eq("status", "confirmed");
    if (error) throw error;
    const picks = { morning: null, afternoon: null };
    (data || []).forEach(p => {
      if (p.sessions && p.sessions.block in picks) {
        picks[p.sessions.block] = {
          id:      p.session_id,
          title:   p.sessions.title,
          speaker: p.sessions.speaker,
          room:    p.sessions.room,
        };
      }
    });
    return picks;
  }

  async function getAccount() {
    let a = (window.NCTEAuth && window.NCTEAuth.currentUser && window.NCTEAuth.currentUser()) || null;
    if (!a && window.NCTEAuth && window.NCTEAuth.refresh) {
      a = await window.NCTEAuth.refresh();
    }
    return a;
  }

  /* ---- Render helpers ---- */
  function escapeHtml(s) {
    return (window.NCTEAuth && window.NCTEAuth.escapeHtml)
      ? window.NCTEAuth.escapeHtml(s)
      : String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[c]);
  }
  function initialsOf(user) {
    const name = ((user.firstName || "") + " " + (user.lastName || "")).trim()
              || (user.email || "").split("@")[0];
    return name.split(/[ .@_-]/).filter(Boolean).map(s => s[0]).slice(0, 2).join("").toUpperCase() || "NE";
  }
  function buildItineraryHtml(picks) {
    return ITINERARY.map(row => {
      if (row.type === "open") {
        return `<li class="is-open"><span class="npass-time">${escapeHtml(row.time)}</span>` +
               `<div class="npass-body"><b>${escapeHtml(row.title)}</b><small>${escapeHtml(row.note)}</small></div></li>`;
      }
      const pick = picks[row.slot];
      if (!pick) {
        return `<li class="is-pending"><span class="npass-time">${escapeHtml(row.time)}</span>` +
               `<div class="npass-body"><b>${escapeHtml(row.pending)}</b><small>Open the planner on this device to reserve a seat.</small></div></li>`;
      }
      return `<li><span class="npass-time">${escapeHtml(row.time)}</span>` +
             `<div class="npass-body"><b>${escapeHtml(pick.title)}</b>` +
             `<small>${escapeHtml(pick.speaker || "")}${pick.room ? " · " + escapeHtml(pick.room) : ""}</small></div></li>`;
    }).join("");
  }

  function fillPassNode(account, picks) {
    const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ").trim()
                  || (account.email || "").split("@")[0];
    const code     = account.ticketCode || "NCTE-PENDING";
    const orgLine  = [account.institution, account.country].filter(Boolean).join(" · ");

    passNode.querySelector("[data-pass-code]").textContent     = code;
    passNode.querySelector("[data-pass-code-2]").textContent   = code;
    passNode.querySelector("[data-pass-initials]").textContent = initialsOf(account);
    passNode.querySelector("[data-pass-name]").textContent     = fullName;
    passNode.querySelector("[data-pass-email]").textContent    = account.email || "";
    passNode.querySelector("[data-pass-email-2]").textContent  = account.email || "";
    passNode.querySelector("[data-pass-org]").textContent      = orgLine;
    passNode.querySelector("[data-pass-day1]").innerHTML       = buildItineraryHtml(picks);
    passNode.querySelector("[data-pass-issued]").textContent   = new Date().toLocaleString("en-CR", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  /* ---- Logo as data URI ----
     html2canvas taints its output canvas if it draws an image whose
     source is cross-origin (or `file://`, which is *always* treated as
     cross-origin in Chrome). The PDF export then fails with
     "Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted
     canvases may not be exported."
     We work around this by replacing the <img src> with an inlined
     `data:` URI BEFORE html2canvas runs. Data URIs don't taint.
     If both fetch and XHR are blocked (Chrome under `file://`), we
     swap the <img> for a CSS text fallback so the export still works. */
  let LOGO_PROMISE = null;
  function loadLogoDataUri() {
    if (LOGO_PROMISE) return LOGO_PROMISE;
    const url = "assets/MAIN_LOGO.png";
    LOGO_PROMISE = (async () => {
      // Method 1 — fetch (works on http(s), Firefox file://, sometimes Chrome file://)
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const blob = await r.blob();
        return await blobToDataUri(blob);
      } catch (e) {
        console.warn("[BoardingPass] logo fetch fallback:", e.message);
      }
      // Method 2 — XHR (sometimes works on Chrome file:// when fetch is blocked)
      try {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.open("GET", url);
          xhr.onload = () => {
            // status 0 happens for valid file:// responses
            if (xhr.status === 200 || xhr.status === 0) {
              blobToDataUri(xhr.response).then(resolve, reject);
            } else reject(new Error("XHR " + xhr.status));
          };
          xhr.onerror = () => reject(new Error("XHR failed"));
          xhr.send();
        });
      } catch (e) {
        console.warn("[BoardingPass] logo XHR failed:", e.message);
      }
      return null;
    })();
    return LOGO_PROMISE;
  }
  function blobToDataUri(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  }

  async function applyLogoToPass() {
    const dataUri = await loadLogoDataUri();
    const logoImg = passNode.querySelector(".npass__logo");
    if (!logoImg) return;
    if (dataUri) {
      logoImg.src = dataUri;
      return;
    }
    // Both inlining methods failed — replace with a text fallback so
    // html2canvas has nothing to taint and the PDF still renders.
    const fallback = document.createElement("div");
    fallback.className = "npass__logo-fallback";
    fallback.textContent = "NCTE 2026";
    logoImg.replaceWith(fallback);
  }

  async function renderQr(code) {
    const qrSlot = passNode.querySelector("[data-pass-qr]");
    qrSlot.innerHTML = "";
    const url = "https://ncte.centrocultural.cr/v/" + encodeURIComponent(code);
    await loadScript(CDN.qrcode);
    const canvas = document.createElement("canvas");
    qrSlot.appendChild(canvas);
    // QRious renders directly into the canvas we hand it.
    new window.QRious({
      element:    canvas,
      value:      url,
      size:       280,
      level:      "M",
      padding:    4,
      foreground: "#041a71",
      background: "#ffffff",
    });
  }

  async function prepare(opts) {
    ensureInjected();
    const account = (opts && opts.account) || await getAccount();
    if (!account)            throw new Error("Please sign in to view your boarding pass.");
    if (!account.ticketCode) throw new Error("Your attendee ID is still being generated. Please refresh in a moment.");

    const picks = (opts && opts.picks) || await fetchPicks();
    fillPassNode(account, picks);
    // Run logo + QR in parallel — both are needed before html2canvas captures.
    await Promise.all([applyLogoToPass(), renderQr(account.ticketCode)]);
    return { account, picks };
  }

  function toast(msg, kind) {
    // If the host page already owns a styled toast slot (planner does), reuse it.
    const t = document.querySelector("[data-toast]");
    if (t) {
      const txt = t.querySelector("[data-toast-text]");
      if (txt) txt.textContent = msg;
      t.classList.toggle("is-error", kind === "error");
      t.classList.add("is-visible");
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove("is-visible"), 3200);
      return;
    }
    // Fallback: ephemeral inline toast so feedback works on index/webinars
    // without requiring a per-page DOM element.
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed", bottom: "24px", left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: kind === "error" ? "#c20f2f" : "var(--cccn-blue-900, #041a71)",
      color: "#fff", padding: "12px 20px",
      borderRadius: "999px", fontFamily: "var(--font-sans, sans-serif)",
      fontWeight: "600", fontSize: "14px", zIndex: 9999,
      boxShadow: "0 16px 36px -10px rgba(0,0,0,.35)", opacity: "0",
      transition: "opacity .2s ease, transform .2s ease",
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
    setTimeout(() => el.remove(), 3400);
  }

  /* ---- Public actions ---- */
  async function preview(opts) {
    const button = opts && opts.button;
    let originalHtml = null;
    if (button) { originalHtml = button.innerHTML; button.disabled = true; button.textContent = "Loading…"; }
    try {
      await prepare(opts);
      open();
    } catch (err) {
      console.error("[BoardingPass] preview error:", err);
      toast(err.message || "Could not render the boarding pass.", "error");
    } finally {
      if (button) { button.disabled = false; if (originalHtml) button.innerHTML = originalHtml; }
    }
  }

  async function download(opts) {
    const button = opts && opts.button;
    let originalHtml = null;
    if (button) { originalHtml = button.innerHTML; button.disabled = true; button.textContent = "Generating PDF…"; }
    try {
      const { account } = await prepare(opts);

      await loadScript(CDN.html2canvas);
      await loadScript(CDN.jspdf);

      // Make sure the node is laid out (modal must be visible for html2canvas)
      const wasOpen = isOpen();
      if (!wasOpen) open();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Force 640px during capture so the PDF render matches the desktop
      // layout regardless of how the on-screen preview was sized for
      // mobile. We restore the inline style after html2canvas finishes.
      const savedInline = passNode.getAttribute("style") || "";
      passNode.style.width    = "640px";
      passNode.style.minWidth = "640px";
      passNode.style.maxWidth = "640px";
      // Give the browser one more paint tick at the new width.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      let canvas;
      try {
        canvas = await window.html2canvas(passNode, {
          scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
          width: 640,
          windowWidth: 640,
        });
      } finally {
        if (savedInline) passNode.setAttribute("style", savedInline);
        else passNode.removeAttribute("style");
      }

      if (!wasOpen) close();

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297
      const margin = 12;
      const maxW = pageW - margin * 2;
      const ratio = canvas.height / canvas.width;
      let drawW = maxW;
      let drawH = drawW * ratio;
      if (drawH > pageH - margin * 2) { drawH = pageH - margin * 2; drawW = drawH / ratio; }
      const x = (pageW - drawW) / 2;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", x, margin, drawW, drawH);
      pdf.save("NCTE-2026-" + (account.ticketCode || "boarding-pass") + ".pdf");
      toast("Boarding pass downloaded ✦");
    } catch (err) {
      console.error("[BoardingPass] PDF error:", err);
      toast(err.message || "Could not generate the PDF. Please try again.", "error");
    } finally {
      if (button) { button.disabled = false; if (originalHtml) button.innerHTML = originalHtml; }
    }
  }

  window.NCTEBoardingPass = { preview, download };
})();
